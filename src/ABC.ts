import * as abcjs from "abcjs/midi";
import {ABCLink} from "./Types";

const SCRAPBOXURL = "https://scrapbox.io/stk-study-music-theory/";
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

const addLinkToABC = (abc: string, startChar: number): string => {
    if (shifted) {
        const splitted = abc.split("]");
        const tail = splitted[splitted.length - 2];
        const updatedTail = tail.replace("[", `[${startChar},`);
        return abc.replace(tail, updatedTail);
    }
    if (/%Links:($|\[(.*|)\d+ .*]$)/.test(abc)) {
        return `${abc}[${startChar} new]`;
    }
    if (/\n$/.test(abc)) {
        return `${abc}%Links:[${startChar} new]`;
    }
    return `${abc}\n%Links:[${startChar} new]`;
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
            document.getElementById(parentSVGElID).addEventListener("mousedown", e => e.stopPropagation());
            window.open(SCRAPBOXURL + pageTitle);
            return
        }

        // const ABC = inputEl.value;
        // inputEl.value = addLinkToABC(ABC, clickedNoteStartChar);
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
    console.log("render", "tuneObjectArray", tuneObjectArray);

    //リンクをハイライト
    const lines = tuneObjectArray[0].lines;//[0].staff[0].voices;
    for (let li in lines) {
        for (let si in lines[li].staff) {
            for (let vi in lines[li].staff[si].voices) {
                let barNumber = 0;
                let noteNumberOffset = 0;
                for (let ei in lines[li].staff[si].voices[vi]) {
                    const element = lines[li].staff[si].voices[vi][ei];
                    if (element.el_type === "bar"){
                        barNumber++;
                        noteNumberOffset = Number(ei) + 1;
                    }
                    if (!element.startChar) continue;
                    if (getLink(links, Number(element.startChar))) {
                        element.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);
                        const classStr = getClass(Number(li), barNumber, Number(vi), Number(ei) - noteNumberOffset);
                        document.getElementById(svgDivID).getElementsByClassName(classStr)[0].classList.add("abclink");
                    }
                }
            }
        }
    }

    // abcjs.renderMidi(playerDivID, abc, {inlineControls: {loopToggle: true,}});
};

const getClass = (lineNumber: number, measureNumber: number, voiceNumber: number, noteNumber: number) => {
    return `abcjs-l${lineNumber} abcjs-m${measureNumber} abcjs-v${voiceNumber} abcjs-n${noteNumber}`;
    // add a prefix to all classes that abcjs adds.
    // if (ret.length > 0) {
    //     ret = ret.join(' '); // Some strings are compound classes - that is, specify more than one class in a string.
    //     ret = ret.split(' ');
    //     for (var i = 0; i < ret.length; i++) {
    //         if (ret[i].indexOf('abcjs-') !== 0 && ret[i].length > 0) // if the prefix doesn't already exist and the class is not blank.
    //             ret[i] = 'abcjs-' + ret[i];
    //     }
    // }
    // return ret.join(' ');
};

window.addEventListener("mousedown", e => {
    console.log("onmousedown", "shifted:", e.shiftKey);
    shifted = e.shiftKey
});
// inputEl.addEventListener("input", onInput);
// onInput();
