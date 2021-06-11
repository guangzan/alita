import { IApi } from '@umijs/types';

// h5,cordova,pc,micro
export default (api: IApi) => {
  api.describe({
    key: 'appType',
    config: {
      schema(joi) {
        return joi.string().valid('h5', 'pc', 'cordova', 'micro', 'native');
      },
      default: 'h5',
    },
  });

  if (api.userConfig.appType !== 'pc') {
    api.modifyDefaultConfig((memo) => {
      return {
        ...memo,
        hd: {},
      };
    });

    api.addHTMLMetas(() => {
      const addItem = {
        content: 'telephone=no',
        name: 'format-detection',
      };
      return [addItem];
    });
    api.addHTMLStyles(() => {
      const addItem = {
        content: `* {
          box-sizing: border-box;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }

        html {
          width: 100%;
          height: 100%;
          text-size-adjust: 100%;
          --alita-safe-area-top: env(safe-area-inset-top);
          --alita-safe-area-bottom: env(safe-area-inset-bottom);
          --alita-safe-area-left: env(safe-area-inset-left);
          --alita-safe-area-right: env(safe-area-inset-right);
        }

        body {
          -moz-osx-font-smoothing: grayscale;
          -webkit-font-smoothing: antialiased;
          margin-left: 0;
          margin-right: 0;
          margin-top: 0;
          margin-bottom: 0;
          padding-left: 0;
          padding-right: 0;
          padding-top: 0;
          padding-bottom: 0;
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          text-rendering: optimizeLegibility;
          overflow: hidden;
          touch-action: manipulation;
          -webkit-user-drag: none;
          -ms-content-zooming: none;
          word-wrap: break-word;
          overscroll-behavior-y: none;
          text-size-adjust: none;
        }

        .alita-page {
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          display: flex;
          position: absolute;
          flex-direction: column;
          justify-content: space-between;
          contain: layout size style;
          overflow: hidden;
          z-index: 0;
        }
        `,
      };
      return [addItem];
    });
  }
};
