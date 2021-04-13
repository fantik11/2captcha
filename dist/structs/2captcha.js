"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Solver = void 0;
const fetch_1 = __importDefault(require("../utils/fetch"));
const _2captchaError_1 = require("./2captchaError");
const utils = __importStar(require("../utils/generic"));
/**
 * The main 2captcha class, housing all API calls and api interactions.
 */
class Solver {
    /**
     * The constructor for the 2captcha Solver class.
     *
     * @param apikey {string} The API key to use
     * @param pollingFrequency {number} The frequency to poll for requests
     */
    constructor(apikey, pollingFrequency = 5000) {
        this._apikey = apikey;
        this._pollingFrequency = pollingFrequency;
    }
    /** The API key this instance is using */
    get apikey() { return this._apikey; }
    /** Frequency the instance polls for updates */
    get pollingFrequency() { return this._pollingFrequency; }
    /** Set the API key for this instance */
    set apikey(update) { this._apikey = update; }
    get in() { return "https://2captcha.com/in.php"; }
    get res() { return "https://2captcha.com/res.php"; }
    get defaultPayload() { return { key: this.apikey, json: 1 }; }
    /**
     * Returns the remaining account balance.
     *
     * @return {Promise<Number>} Remaining balance
     * @throws APIError
     * @example
     * Solver.balance()
     * .then((res) => {
     *   console.log(res)
     * })
     */
    async balance() {
        const res = await fetch_1.default(this.res + utils.objectToURI({
            ...this.defaultPayload,
            action: "getbalance"
        }));
        const result = await res.text();
        try {
            const data = JSON.parse(result);
            if (data.status == 1) {
                return parseFloat(data.request);
            }
            throw new _2captchaError_1.APIError(data.request);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
    }
    /**
     * @private
     *
     * Polls for  a captcha, finding out if it's been completed
     * @param {string} id Captcha ID
     *
     * @returns {Promise<CaptchaAnswer>}
     * @throws APIError
     */
    async pollResponse(id) {
        const payload = {
            ...this.defaultPayload,
            action: "get",
            id: id
        };
        await utils.sleep(this.pollingFrequency);
        const res = await fetch_1.default(this.res + utils.objectToURI(payload));
        const result = await res.text();
        let data;
        try {
            data = JSON.parse(result);
            if (data.status == 1) {
                return { data: data.request, id: id };
            }
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        switch (data.request) {
            case "CAPCHA_NOT_READY": return this.pollResponse(id);
            default: {
                throw new _2captchaError_1.APIError(data.request);
            }
        }
    }
    /**
     * Solves a google Recaptcha, returning the result as a string.
     *
     * @param {string} googlekey The google captcha key
     * @param {string} pageurl The URL the captcha appears on
     * @param {object} extra Extra options
     *
     * @returns {Promise<CaptchaAnswer>} The result from the solve.
     * @throws APIError
     * @example
     * solver.recaptcha("6Ld2sf4SAAAAAKSgzs0Q13IZhY02Pyo31S2jgOB5", "https://patrickhlauke.github.io/recaptcha/")
     * .then((res) => {
     *   console.log(res)
     * })
     */
    async recaptcha(googlekey, pageurl, extra = {}) {
        //'extra' is user defined, and the default contents should be overridden by it.
        const payload = {
            invisible: false,
            header_acao: false,
            ...extra,
            googlekey: googlekey,
            pageurl: pageurl,
            action: "get",
            method: "userrecaptcha",
            ...this.defaultPayload
        };
        const response = await fetch_1.default(this.in + utils.objectToURI(payload));
        const result = await response.text();
        let data;
        try {
            data = JSON.parse(result);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        if (data.status == 1) {
            return this.pollResponse(data.request);
        }
        else {
            throw new _2captchaError_1.APIError(data.request);
        }
    }
    /**
     * Solves a google Recaptcha, returning the result as a string.
     *
     * @param {string} sitekey The hcaptcha site key
     * @param {string} pageurl The URL the captcha appears on
     * @param {object} extra Extra options
     *
     * @returns {Promise<CaptchaAnswer>} The result from the solve
     * @throws APIError
     * @example
     * solver.recaptcha("37f92ac1-4956-457e-83cd-723423af613f", "https://www.tokyobitcoiner.com/hcaptcha")
     * .then((res) => {
     *   console.log(res)
     * })
     */
    async hcaptcha(sitekey, pageurl, extra = {}) {
        //'extra' is user defined, and the default contents should be overridden by it.
        const payload = {
            invisible: false,
            header_acao: false,
            ...extra,
            sitekey: sitekey,
            pageurl: pageurl,
            action: "get",
            method: "hcaptcha2",
            ...this.defaultPayload
        };
        const response = await fetch_1.default(this.in + utils.objectToURI(payload));
        const result = await response.text();
        let data;
        try {
            data = JSON.parse(result);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        if (data.status == 1) {
            return this.pollResponse(data.request);
        }
        else {
            throw new _2captchaError_1.APIError(data.request);
        }
    }
    /**
     * Solves a image-based captcha.
     * @param {string} base64image Base64 image data for the captcha
     * @param {object} extra Extra properties to pass to 2captcha
     *
     * @returns {Promise<CaptchaAnswer>} The result from the solve
     * @throws APIError
     * @example
     * imageCaptcha(fs.readFileSync("./captcha.png", "base64"))
     * .then((res) => {
     *   console.log(res)
     * })
     */
    async imageCaptcha(base64image, extra = {}) {
        const payload = {
            ...extra,
            ...this.defaultPayload,
            method: "base64"
        };
        const response = await fetch_1.default(this.in + utils.objectToURI(payload), { body: JSON.stringify({ "body": base64image }), method: "post" });
        const result = await response.text();
        let data;
        try {
            data = JSON.parse(result);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        if (data.status == 1) {
            return this.pollResponse(data.request);
        }
        else {
            throw new _2captchaError_1.APIError(data.request);
        }
    }
    /**
     * Solves a FunCaptcha
     * @param publicKey The FunCaptcha Public Key
     * @param pageurl The URL to the website the captcha is seen on
     * @param serviceURL The FunCaptcha Service URL (recommended)
     * @param extra Extra properties to pass to 2captcha
     *
     * @returns {Promise<CaptchaAnswer>} The result from the solve
     * @throws APIError
     * funCaptcha("12AB34CD-56F7-AB8C-9D01-2EF3456789A0", "http://mysite.com/page/with/funcaptcha/")
     * .then((res) => {
     *   console.log(res)
     * })
     */
    async funCaptcha(publicKey, pageURL, serviceURL, extra = {}) {
        const payload = {
            ...extra,
            ...this.defaultPayload,
            method: "funcaptcha",
            publickey: publicKey,
            pageurl: pageURL,
            ...(serviceURL ? { surl: serviceURL } : {})
        };
        const response = await fetch_1.default(this.in + utils.objectToURI(payload));
        const result = await response.text();
        let data;
        try {
            data = JSON.parse(result);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        if (data.status == 1) {
            return this.pollResponse(data.request);
        }
        else {
            throw new _2captchaError_1.APIError(data.request);
        }
    }
    /**
     * Report an unsuccessful solve
     *
     * @param {string} id The id of the captcha solve
     *
     * @returns {Promise<void>} Resolves on completion
     * @throws APIError
     * @example
     * report("55316")
     */
    async report(id) {
        const payload = {
            id: id,
            action: "reportbad",
            ...this.defaultPayload
        };
        const response = await fetch_1.default(this.in + utils.objectToURI(payload));
        const result = await response.text();
        let data;
        try {
            data = JSON.parse(result);
        }
        catch {
            throw new _2captchaError_1.APIError(result);
        }
        if (data.request == "OK_REPORT_RECORDED") {
            return;
        }
        else {
            throw new _2captchaError_1.APIError(data.request);
        }
    }
}
exports.Solver = Solver;
