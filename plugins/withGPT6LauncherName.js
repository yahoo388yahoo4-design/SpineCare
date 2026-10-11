// Keep native Xcode scheme/project as 'SpineCare' for existing CI, while making
// this GPT-6 variant easy to distinguish from other installed SpineCare apps.
const { withStringsXml } = require('@expo/config-plugins');

module.exports = function withGPT6LauncherName(config) {
  return withStringsXml(config, (mod) => {
    const strings = mod.modResults.resources.string || [];
    const label = strings.find((item) => item.$ && item.$.name === 'app_name');
    if (label) {
      label._ = 'SpineCare GPT-6';
    } else {
      strings.push({ $: { name: 'app_name' }, _: 'SpineCare GPT-6' });
    }
    mod.modResults.resources.string = strings;
    return mod;
  });
};
