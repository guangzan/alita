// ref:
// - https://umijs.org/plugin/develop.html
import create from './create-cordova';
import { events, ConfigParser } from 'cordova-common';
import { join } from 'path';
import assert from 'assert';
import os from 'os';
import { lstatSync, readFileSync, writeFileSync, existsSync } from 'fs-extra';
import childProcess from 'child_process';

function setCordovaConfig(path, isProduction) {
  const webPort = process.env.PORT || 8000;
  const ip = os.networkInterfaces().en0.filter(item => item.family === 'IPv4')[0].address;
  const webUrl = !isProduction ? `http://${ip}:${webPort}` : 'index.html';
  var configPath = join(path, 'config.xml');
  let content = readFileSync(configPath).toString();
  const contentPattern = `<content (.*)src="[^"]*"(.*)/>`;
  const contentRegex = new RegExp(contentPattern);
  content = content.replace(contentRegex, `<content $1src="${webUrl}"$2/>`);
  if (!isProduction) {
    const navPattern = `(<allow-navigation .*)href="[^"]*"(.*/>)`;
    const navRegex = new RegExp(navPattern);
    if (navRegex.test(content)) {
      content = content.replace(navRegex, `$1href="${webUrl}"$2`);
    } else {
      const widgePattern = `</widget>`;
      const widgeRegex = new RegExp(widgePattern);
      content = content.replace(widgeRegex, `\t<allow-navigation href="${webUrl}" />\n</widget>`);
    }
  }
  writeFileSync(configPath, content);
}

export default function (api, options) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cordovaPlatform = process.env.CORDOVA || 'ios';
  const isAlita = process.env.IS_ALITA && process.env.IS_ALITA !== 'none';
  console.log(`cordova platform use ${cordovaPlatform}`);
  api.modifyDefaultConfig(memo => {
    return {
      // build目录默认为www
      ...memo,
      outputPath: 'www',
    }
  });
  // dev
  // 1.cordova create
  api.registerCommand(
    'cordova',
    {
      description: 'cordova init',
    },
    args => {
      const addPlatforms = (isIos) => {
        childProcess.exec(`cordova platforms add ${isIos ? 'ios' : 'android'}`, {}, (error, stdout, stderr) => {
          if (error) {
            console.error('exec error: ' + error);
            return
          }
          console.log(stdout)
          console.log(stderr)
        })
        console.log('cordova add platforms ...');
      }
      if (args.init) {
        const pkg = require(join(api.paths.cwd, 'package.json'));
        const optionalName = pkg.name || 'alitaapp';
        const optionalId = `com.alitaexample.${optionalName}`;
        create(api.paths.cwd, optionalId, optionalName, {}, events);
        if (args.ios || args.android) {
          addPlatforms(args.ios);
        } else {
          console.log(`cordova init success,please run "${isAlita ? 'alita' : 'umi'} cordova --ios" or "${isAlita ? 'alita' : 'umi'} cordova --android"  to add cordova platforms`);
        }
      } else if (args.ios || args.android) {
        addPlatforms(args.ios);
      }
    },
  );
  var configPath = join(api.paths.cwd, 'config.xml');
  if (existsSync(configPath)) {
    // 3.node config-xml.js true
    // console.log(api);
    setCordovaConfig(api.paths.cwd, isProduction);

    // 4.cordova build ios
    // api.devServerPort 需要提交PR来支持
    childProcess.exec(`cordova build ${cordovaPlatform}`, {}, (error, stdout, stderr) => {
      if (error) {
        console.error('exec error: ' + error);
        return
      }
      // console.log(stdout)
      // console.log(stderr)
    })

    // 5.node serve-cordova.js ios
    const dirToServe = join(api.paths.cwd, 'platforms', cordovaPlatform, 'platform_www');
    const serveProcess = childProcess.exec(
      'serve -l 8723',
      { stdio: 'inherit', cwd: dirToServe } as any,
      (error, stdout, stderr) => {
        console.error(error.message);
        console.log(stdout.toString('utf8'));
      }
    );
    console.log(`cordova serve(pid:${serveProcess.pid})`);
    // 6.add app.js
    //  export function render(oldRender) {
    //    function onDeviceReady() {
    //      oldRender();
    //    }
    //    document.addEventListener('deviceready', onDeviceReady, false);
    //  }
    api.addRuntimePlugin(join(__dirname, './runtime'));
    // 7.add cordova.js
    //  <% if(context.env === 'production') { %>
    //    <script src="./cordova.js"></script>
    //  <% } else {%>
    //    <script src="http://192.168.3.111:8001/cordova.js"></script>
    //  <% } %>
    const ip = os.networkInterfaces().en0.filter(item => item.family === 'IPv4')[0].address;
    let cordovaSrc = './cordova.js';
    if (!isProduction) {
      cordovaSrc = `http://${ip}:${8723}/cordova.js`;
    }
    api.addHTMLScript({
      src: cordovaSrc,
    });
    // 8.umi dev
    // build
    // 1. outputPath:'www',
    // 2. umi build
    api.onBuildSuccess(() => {
      console.log(`[${isAlita ? 'alita' : 'umi'}]: success`);
      // 3. node config-xml.js false
      setCordovaConfig(api.paths.cwd, isProduction);
      // 4. cordova build ios
      childProcess.exec(`cordova build ${cordovaPlatform}`, {}, (error, stdout, stderr) => {
        if (error) {
          console.error('exec error: ' + error);
          return
        }
        // console.log(stdout)
        // console.log(stderr)
      })
    });
  } else {
    console.log(`please run "${isAlita ? 'alita' : 'umi'} cordova --init --ios" to init cordova and add cordova platform`);
  }
}