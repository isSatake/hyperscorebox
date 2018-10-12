import * as abcjs from "abcjs/midi";

type Link = {
    startChars: number[],
    pageTitle: string
}

type Line = {
    id: string,
    text: string
}

const MSG = "hyperscorebox";
// const SCRAPBOX_TITLE = location.pathname.split("/")[2];

const getPageLines = async () => {
    const res = await fetch(`https://scrapbox.io/api/pages${location.pathname}`);
    const {lines} = await res.json();
    return lines;
};

const getABCElIDs = (lines: Line[]) => {
    const IDs = [];
    for(let line of lines){
        if(line.text === "code:abc"){
            IDs.push(`L${line.id}`);
        }
    }
    return IDs;
};

setTimeout(async () => {
    console.log(MSG, "hello from hyperscorebox");
    const ABCIDs = getABCElIDs(await getPageLines());
    for(let ABCID of ABCIDs){
        document.getElementById(ABCID).setAttribute("style","background:red");
    }
}, 1000);


// const SCRAPBOXURL = "https://scrapbox.io/stk-study-music-theory/";
// const LINK_HIGHLIGHT_COLOR = "#3965ff";
// const inputEl = document.getElementById("abcinput");
// let shifted: boolean = false;
//
// const parseLink = (abc: string): Link[] => {
//     const parsedLinks: Link[] = [];
//     const linkMached = abc.match(/%Links:.*/);
//     if (!linkMached) {
//         return [];
//     }
//     console.log("parseLink", "linkMatched", linkMached[0]);
//
//     const linkStr = linkMached[0].replace(/%Links:/, "");
//     const links = linkStr.split("]");
//     if (links.length < 1) {
//         return [];
//     }
//
//     for (let link of links) {
//         link = link.replace("[", "");
//         const arr = link.split(" ");
//         if (arr.length < 2) continue;
//         const numbersStr: string[] = arr[0].split(",");
//         const numbers: number[] = numbersStr.map(str => Number(str));
//         parsedLinks.push({startChars: numbers, pageTitle: arr[1]});
//     }
//
//     console.log("parseLink", "parsedLinks", parsedLinks);
//     return parsedLinks;
// };
//
// const onInput = () => {
//     console.log("inputEl", "oninput");
//     const ABC: string = (inputEl as HTMLInputElement).value;
//     render(ABC, inputEl as HTMLInputElement, parseLink(ABC));
// };
//
// const addLinkToABC = (abc: string, startChar: number): string => {
//     if (shifted) {
//         const splitted = abc.split("]");
//         const tail = splitted[splitted.length - 2];
//         const updatedTail = tail.replace("[", `[${startChar},`);
//         return abc.replace(tail, updatedTail);
//     }
//     if (/%Links:($|\[(.*|)\d+ .*]$)/.test(abc)) {
//         return `${abc}[${startChar} new]`;
//     }
//     if (/\n$/.test(abc)) {
//         return `${abc}%Links:[${startChar} new]`;
//     }
//     return `${abc}\n%Links:[${startChar} new]`;
// };
//
// const generateClickListener = (inputEl: HTMLInputElement, links: Link[]) => {
//     return (abcElem, tuneNumber, classes): void => {
//         console.log("abcClickListener", abcElem, tuneNumber, classes);
//         //abcjsによる赤ハイライトを取り消す
//         abcElem.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);
//
//         const clickedNoteStartChar: number = abcElem.startChar;
//         const pageTitle: string | null = getLink(links, clickedNoteStartChar);
//         if (pageTitle) {
//             console.log("abcClickListener", "Linked note is clicked.", "startChar:", clickedNoteStartChar, "destination:", pageTitle);
//             window.open(SCRAPBOXURL + pageTitle);
//             return
//         }
//
//         const ABC = inputEl.value;
//         inputEl.value = addLinkToABC(ABC, clickedNoteStartChar);
//         onInput();
//
//     };
// };
//
// const getLink = (links: Link[], startChar: number): string | null => {
//     for (let link of links) {
//         for (let _startChar of link.startChars) {
//             if (_startChar === startChar) {
//                 return link.pageTitle
//             }
//         }
//     }
//     return null
// };
//
// const render = (abc: string, inputEl: HTMLInputElement, links: Link[]): void => {
//     const options = {
//         clickListener: generateClickListener(inputEl, links),
//         add_classes: true,
//         staffwidth: 1024
//     };
//     const tuneObjectArray = abcjs.renderAbc("svgoutput", abc, options);
//     console.log("render", "tuneObjectArray", tuneObjectArray);
//
//     //リンクをハイライト
//     const voices = tuneObjectArray[0].lines[0].staff[0].voices;
//     for (let voice of voices) {
//         for (let element of voice) {
//             if (!element.startChar) continue;
//             if (getLink(links, Number(element.startChar))) {
//                 element.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);
//             }
//         }
//     }
//
//     abcjs.renderMidi("midioutput", abc, {inlineControls: {loopToggle: true,}});
// };
//
// window.addEventListener("mousedown", e => {
//     console.log("onmousedown", "shifted:", e.shiftKey);
//     shifted = e.shiftKey
// });
// inputEl.addEventListener("input", onInput);
// onInput();
