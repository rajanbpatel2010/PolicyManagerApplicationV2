import {
  AccessControl,
  AuthenticationStrength,
  BiometricAuthError,
  BiometryType
} from "./chunk-DM3YM75I.js";
import {
  registerPlugin
} from "./chunk-TG2TFVOY.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@capgo/capacitor-native-biometric/dist/esm/index.js
var NativeBiometric = registerPlugin("NativeBiometric", {
  web: () => import("./web-B5CLF5VV.js").then((m) => new m.NativeBiometricWeb())
});
export {
  AccessControl,
  AuthenticationStrength,
  BiometricAuthError,
  BiometryType,
  NativeBiometric
};
//# sourceMappingURL=@capgo_capacitor-native-biometric.js.map
