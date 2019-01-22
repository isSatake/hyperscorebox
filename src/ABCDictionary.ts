//楽譜IMEの辞書管理
//constructorでasync/awaitできないので、initABCDictを最初に呼ぶこと

export class ABCDictionary {
    private readonly MSG = "ABCDictionary";
    private readonly doremiToABC = {
        "ド": "c",
        "レ": "d",
        "ミ": "e",
        "ファ": "f",
        "ソ": "g",
        "ラ": "a",
        "シ": "b"
    };

    private readonly accidentalToABC = {
        "♯": "^",
        "＃": "^",
        "#": "^",
        "♭": "_",
        "♮": "="
    };
    private abcDict: {title: string, abc: string}[];
    public initABCDict = async () => {
        const pagesRes = await fetch(`https://scrapbox.io/api/pages/abcdict?limit=1000`);
        const {pages} = await pagesRes.json();
        const abcDict = [];
        for (let page of pages) {
            const {title} = page;
            const pageRes = await fetch(`https://scrapbox.io/api/pages/abcdict/${title}/text`);
            const text = await pageRes.text();
            const lines = text.split("\n");
            let codeIndent = -1;
            let abc = "";
            for (let line of lines) {
                if (/code:.*\.abc/.test(line)) {
                    codeIndent = line.replace(/code:.*\.abc/, "").length;
                    continue;
                }
                if (codeIndent > -1) {
                    const r = new RegExp(`^ {${codeIndent}}`);
                    if (r.test(line)) {
                        abc += `${line.replace(/^ +/, "")}\n`;
                    }
                }
            }
            if (codeIndent > -1) {
                abcDict.push({title: title, abc: abc.replace(/\n*$/, "")});
            }
        }
        this.abcDict = abcDict;
    };

    private getRegExp = (arr: string[]): RegExp => {
        const length = arr.length;
        let str = "";
        for (let i in arr) {
            if (i === "0") {
                str += "(";
            }
            str += arr[i];
            if (i === (length - 1).toString()) {
                str += ")";
                return new RegExp(str);
            }
            str += "|";
        }
    };

    private convertAccidentals = (input: string) => {
        let result = input;
        for (let accidental of Object.keys(this.accidentalToABC)) {
            const accRegExp = new RegExp("[a-g]" + accidental, "g");
            const matched = result.match(accRegExp);
            if (!matched) continue;
            for (let match of matched) {
                result = result.replace(match, this.accidentalToABC[accidental] + match.replace(accidental, ""));
            }
        }
        return result;
    };

    private convertDoremiToABC = (input: string) => {
        let result = input;
        for (let key of Object.keys(this.doremiToABC)) {
            const regexp = new RegExp(key, "g");
            result = result.replace(regexp, this.doremiToABC[key]);
        }
        return result;
    };

    private convertToABC = (input: string): string | null => {
        let convertedStr = "";
        if (this.getRegExp(Object.keys(this.doremiToABC)).test(input)) {
            //ドレミ
            console.log(this.MSG, "convert", "doremi", input);
            convertedStr = this.convertDoremiToABC(input);
        }
        const nextStr = convertedStr ? convertedStr : input;
        if (this.getRegExp(Object.keys(this.accidentalToABC)).test(nextStr)) {
            //臨時記号
            console.log(this.MSG, "convert", "acc", nextStr);
            convertedStr = this.convertAccidentals(nextStr);
        }
        if (convertedStr) return convertedStr;
        return null;
    };
    public getSearchResult = (input: string): string[] => {
        console.log(this.MSG, "searchDict", input);
        if (input === "") return [];
        const candidates = [];
        let searchStr = input;

        const converted = this.convertToABC(searchStr);
        if (converted) {
            searchStr = converted;
            candidates.push(converted);
        }
        for (let entry of this.abcDict) {
            if (new RegExp(".*" + searchStr + ".*").test(entry.title)) {
                candidates.push(entry.abc)
            }
        }
        return candidates
    };
}

export const imeDict = new ABCDictionary();