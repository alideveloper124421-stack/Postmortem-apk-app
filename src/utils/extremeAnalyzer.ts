/**
 * 🩸 GLITCH EXTREME RE ENGINE v9.9
 * Features: True Dalvik Opcode Decoder, Kill-Switch Hunter, Auto-Patch Generator
 */

export const OPCODES: Record<number, string> = {
    0x00: 'nop', 0x01: 'move', 0x0e: 'return-void', 0x0f: 'return',
    0x11: 'return-object', 0x12: 'const/4', 0x13: 'const/16', 0x14: 'const',
    0x1a: 'const-string', 0x1c: 'const-class', 0x22: 'new-instance',
    0x27: 'throw', 0x32: 'if-eq', 0x33: 'if-ne', 0x38: 'if-eqz', 0x39: 'if-nez',
    0x52: 'iget', 0x55: 'iget-object', 0x59: 'iput', 0x5b: 'iput-object',
    0x62: 'sget', 0x63: 'sget-wide', 0x65: 'sget-object', 0x66: 'sget-boolean',
    0x69: 'sput', 0x6b: 'sput-object', 0x6c: 'sput-boolean',
    0x6e: 'invoke-virtual', 0x70: 'invoke-direct', 0x71: 'invoke-static', 0x72: 'invoke-interface'
};

export interface ExtremeTarget {
    className: string;
    methodName: string;
    signature: string;
    smaliCode: string[];
    autoPatch: string;
    fridaHook: string;
    reason: string;
}

export function decodeRealInsns(buffer: Uint8Array, codeOff: number, insnsSize: number): string[] {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const smali: string[] = [];
    let offset = codeOff;
    const endOffset = codeOff + (insnsSize * 2);

    while (offset < endOffset && offset + 1 < buffer.length) {
        const opcode = view.getUint8(offset);
        const rawByte2 = view.getUint8(offset + 1);
        const instrName = OPCODES[opcode] || `unknown_0x${opcode.toString(16)}`;
        let line = `    ${instrName}`;

        if (opcode === 0x1a) {
            const strIdx = view.getUint16(offset + 2, true);
            line += ` v0, string@${strIdx}`;
            offset += 4;
        } else if (opcode === 0x12) {
            const vA = rawByte2 & 0x0F;
            const lit = (rawByte2 >> 4) & 0x0F;
            line = `    const/4 v${vA}, 0x${lit.toString(16)}`;
            offset += 2;
        } else if (opcode >= 0x6e && opcode <= 0x72) {
            const methodIdx = view.getUint16(offset + 2, true);
            line += ` {v0}, method@${methodIdx}`;
            offset += 6;
        } else if (opcode === 0x0e) {
            offset += 2;
        } else if (opcode === 0x0f || opcode === 0x11) {
            const vA = rawByte2 & 0x0F;
            line = `    return v${vA}`;
            offset += 2;
        } else if (opcode === 0x66 || opcode === 0x6c) {
            const fieldIdx = view.getUint16(offset + 2, true);
            line += ` v0, field@${fieldIdx}`;
            offset += 4;
        } else {
            offset += 2;
        }
        smali.push(line);
    }
    return smali;
}

export function huntKillSwitches(classes: any[]): ExtremeTarget[] {
    const targets: ExtremeTarget[] = [];
    const premiumKeywords = /is|has|check|can|should|premium|vip|pro|ads|license|bought|subscribe/i;

    classes.forEach(cls => {
        if (!cls.methods) return;
        cls.methods.forEach((m: any) => {
            if (m.returnType === 'Z' && m.name !== '<init>' && m.name !== '<clinit>' && premiumKeywords.test(m.name)) {
                if (m.instructions && m.instructions.length < 20) {
                    const smaliPatch = [
                        `.method public ${m.name}${m.signature}`,
                        `    .registers 2`,
                        `    const/4 v0, 0x1`,
                        `    return v0`,
                        `.end method`
                    ].join('\n');

                    const fridaHook = `
Java.perform(function() {
    var target = Java.use("${cls.className.replace(/^L/, '').replace(/;$/, '').replace(/\//g, '.')}");
    target.${m.name}.implementation = function() {
        console.log("[GLITCH] Bypassed ${m.name} -> Returning TRUE!");
        return true;
    };
});`;

                    targets.push({
                        className: cls.className,
                        methodName: m.name,
                        signature: m.signature,
                        smaliCode: m.instructions,
                        autoPatch: smaliPatch,
                        fridaHook: fridaHook,
                        reason: "Boolean return + Premium Keyword + Short Logic = KILL SWITCH"
                    });
                }
            }
        });
    });
    return targets;
}
