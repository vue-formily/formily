import install from './install';
import { register } from './helpers/elements';
import plug from './plug';

export * from './core/elements';
export * from './core/validations';

const VueFormily = {
  install,
  plug,
  register
};

export { install, VueFormily };

export default VueFormily;
