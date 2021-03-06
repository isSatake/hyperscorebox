import * as abcjs from "abcjs/midi";
import {ABCLink} from "./Types";
import {SCRAPBOX_URL} from "./Scrapbox";

const LINK_HIGHLIGHT_COLOR = "#3965ff";
const inputEl = document.getElementById("abcinput");
let shifted: boolean = false;

export const parseLink = (abc: string): ABCLink[] => {
    const parsedLinks: ABCLink[] = [];
    const linkMached = abc.match(/%Links:.*/);
    if (!linkMached) {
        return [];
    }
    console.log("parseLink", "linkMatched", linkMached[0]);

    const linkStr = linkMached[0].replace(/%Links:/, "");
    const links = linkStr.split("]");
    if (links.length < 1) {
        return [];
    }

    for (let link of links) {
        link = link.replace("[", "");
        const arr = link.split(" ");
        if (arr.length < 2) continue;
        const numbersStr: string[] = arr[0].split(",");
        const numbers: number[] = numbersStr.map(str => Number(str));
        parsedLinks.push({startChars: numbers, pageTitle: arr[1]});
    }

    console.log("parseLink", "parsedLinks", parsedLinks);
    return parsedLinks;
};

const addLinkToABC = (startChar: number, abc?: string): string => {
    if (shifted) { //カレントキャレットがあるコードブロックからstringを取ってこないといけない
        const splitted = abc.split("]");
        const tail = splitted[splitted.length - 2];
        const updatedTail = tail.replace("[", `[${startChar},`);
        return abc.replace(tail, updatedTail);
    }
    return `[${startChar} new]`;
};

const generateClickListener = (links: ABCLink[], parentSVGElID: string) => {
    return (abcElem, tuneNumber, classes): void => {
        console.log("abcClickListener", abcElem, tuneNumber, classes);
        //abcjsによる赤ハイライトを取り消す
        abcElem.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);

        const clickedNoteStartChar: number = abcElem.startChar;
        const pageTitle: string | null = getLink(links, clickedNoteStartChar);
        if (pageTitle) {
            console.log("abcClickListener", "Linked note is clicked.", "startChar:", clickedNoteStartChar, "destination:", pageTitle);

            location.href = SCRAPBOX_URL + pageTitle;
            return
        }

        //リンクテキスト挿入
        document.execCommand("insertText", null, addLinkToABC(clickedNoteStartChar));
        // onInput();
    };
};

const getLink = (links: ABCLink[], startChar: number): string | null => {
    for (let link of links) {
        for (let _startChar of link.startChars) {
            if (_startChar === startChar) {
                return link.pageTitle
            }
        }
    }
    return null
};

export const render = (abc: string, links: ABCLink[], staffWidth: number, svgDivID: string, playerDivID: string): void => {
    const options = {
        clickListener: generateClickListener(links, svgDivID),
        add_classes: true,
        staffwidth: staffWidth
    };
    const tuneObjectArray = abcjs.renderAbc(svgDivID, abc, options);
    abcjs.renderMidi(playerDivID, abc, {generateInline: false, generateDownload: true});
    if(links.length === 0) return;

    //リンクをハイライト
    const lines = tuneObjectArray[0].lines;
    for (let line of lines) {
        for (let staff of line.staff) {
            for (let voice of staff.voices) {
                for (let element of voice) {
                    if (element.startChar === undefined) continue;
                    if (getLink(links, Number(element.startChar))) {
                        element.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);
                    }
                }
            }
        }
    }

};

export const getSMF = (containerEl: Element): ArrayBuffer => {
    const midiDlEl = containerEl.querySelector(".abcjs-download-midi a");
    const midiStr = midiDlEl.getAttribute("href").replace(/data:audio\/midi,/, "").replace(/MThd/g, "%4D%54%68%64").replace(/MTrk/g, "%4D%54%72%6B");
    const midiArray = midiStr.split("%");
    midiArray.shift();
    const arrayBuffer = new ArrayBuffer(midiArray.length);
    const dataView = new DataView(arrayBuffer);
    let position = 0;
    for(let byte of midiArray){
        dataView.setUint8(position, parseInt(byte, 16));
        position++;
    }
    return arrayBuffer;
};

window.addEventListener("click", e => {
    console.log("onclick", "shifted:", e.shiftKey);
    shifted = e.shiftKey
});
