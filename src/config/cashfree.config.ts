import { Cashfree, CFEnvironment } from "cashfree-pg";
import { config } from "./variables.config";

const paymentENV = (config.nodeEnv === 'development') ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
export const CashFree = new Cashfree(paymentENV, config.cashfreeAppId, config.cashfreeSecretKey);