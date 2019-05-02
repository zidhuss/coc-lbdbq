"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const coc_nvim_1 = require("coc.nvim");
const which_1 = __importDefault(require("which"));
const child_process_1 = require("child_process");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { subscriptions } = context;
        try {
            which_1.default.sync('lbdbq');
        }
        catch (e) {
            coc_nvim_1.workspace.showMessage('lbdbq required for coc-lbdbq', 'warning');
            return;
        }
        let source = {
            name: 'lbdbq',
            enable: true,
            filetypes: ['mail'],
            priority: 99,
            sourceType: coc_nvim_1.SourceType.Service,
            triggerPatterns: [
                /^(Bcc|Cc|From|Reply-To|To):\s*/,
                /^(Bcc|Cc|From|Reply-To|To):.*,\s*/,
            ],
            doComplete: function (opt) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!opt.input) {
                        return;
                    }
                    const { input } = opt;
                    const matches = yield query(input);
                    return {
                        items: matches.map(m => {
                            return {
                                word: `${m.name} <${m.email}>`,
                            };
                        }),
                    };
                });
            },
        };
        subscriptions.push(coc_nvim_1.sources.addSource(source));
    });
}
exports.activate = activate;
function query(input) {
    return new Promise((resolve, reject) => {
        const lbdbq = child_process_1.spawn('lbdbq', [input]);
        let matches = [];
        let first = true;
        lbdbq.stdout.on('data', data => {
            if (first) {
                first = false;
                return;
            }
            data
                .toString()
                .split('\n')
                .slice(0, -1)
                .forEach((m) => {
                const [email, name] = m
                    .toString()
                    .split(/\t/)
                    .slice(0, 2);
                matches.push({ email, name });
            });
        });
        lbdbq.on('exit', () => resolve(matches));
        lbdbq.on('error', err => reject(err));
    });
}
//# sourceMappingURL=index.js.map