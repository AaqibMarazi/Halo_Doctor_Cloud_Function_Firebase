"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDoctorAccountStatus = exports.CURRENCY = exports.CurrencySign = exports.DoctorDefaultBasePrice = void 0;
const collections_1 = require("./collections");
/**
 * Default doctor base price upon registration
 */
exports.DoctorDefaultBasePrice = 10;
exports.CurrencySign = `$`;
exports.CURRENCY = `USD`;
/**
 * default doctor account status upon registration
 */
exports.DefaultDoctorAccountStatus = collections_1.AccountStatus.NonActive;
//# sourceMappingURL=constants.js.map