import {ABCBlock, ScoreView} from "./Types";
import {generateInlineStyle} from "./Scrapbox";
import {getSMF, parseLink, render} from "./ABC";

//Scrapboxページ
//ページ内に書かれた楽譜情報を管理する
export class Page {
    private scoreViews: ScoreView[] = [];
    private tinySynth;

    constructor(tinySynth) {
        this.tinySynth = tinySynth;
    }

    private pushScoreView = (block: ABCBlock): void => {
        const {titleElementID, titleElement, blockHeight, offsetLeft, width, abc, isEditing} = block;

        //ページ遷移時、複数回pushScoreElementが実行されてしまうのでDivの重複を回避する
        const oldScoreDiv = document.querySelector(`#ABC${titleElementID}`);
        if (oldScoreDiv) oldScoreDiv.parentNode.removeChild(oldScoreDiv);

        const scoreView = document.createElement("div");
        scoreView.classList.add("scoreview");
        scoreView.setAttribute("id", `ABC${titleElementID}`);
        scoreView.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));
        scoreView.addEventListener("mousedown", e => {
            e.stopPropagation();
            const {classList} = titleElement;
            if (!classList.contains("abcediting")) {
                classList.add("abcediting");
            }
        });

        const svgDiv = document.createElement("div");
        const svgDivID = `SVG${titleElementID}`;
        svgDiv.setAttribute("id", svgDivID);
        // svgDiv.setAttribute("style", `height:${blockHeight - 26}px`);

        const playerDiv = document.createElement("div");
        const playerDivID = `PLAYER${titleElementID}`;
        playerDiv.setAttribute("id", playerDivID);
        playerDiv.setAttribute("style", `margin-top:-10px`);

        const midiControllerDiv = document.createElement("div");
        midiControllerDiv.setAttribute("style", `display: none; position: absolute; top: ${blockHeight}`);
        const playButton = document.createElement("button");
        playButton.innerText = "▶";
        playButton.addEventListener("mousedown", e => {
            this.tinySynth.loadMIDI(getSMF(scoreView));
            this.tinySynth.stopMIDI();
            this.tinySynth.playMIDI();
            e.stopPropagation();
        });
        midiControllerDiv.appendChild(playButton);

        scoreView.appendChild(svgDiv);
        scoreView.appendChild(playerDiv);
        scoreView.appendChild(midiControllerDiv);
        block.titleElement.appendChild(scoreView);
        this.scoreViews.push({
            parentElementID: titleElementID,
            element: scoreView
        });
        render(abc, parseLink(abc), titleElement.clientWidth - 30, svgDivID, playerDivID);

        scoreView.addEventListener("mouseover", (e) => {
            //再生ボタン追加
            midiControllerDiv.style.display = "";
            //クリックイベント追加
        });
        scoreView.addEventListener("mouseleave", () => {
            midiControllerDiv.style.display = "none";
        })
    };

    private getElement = (elementID: string): ScoreView => {
        if (this.scoreViews.length < 1) return null;
        for (let scoreView of this.scoreViews) {
            if (scoreView.parentElementID === elementID) {
                return scoreView;
            }
        }
        return null;
    };

    private updateElement = (block: ABCBlock): boolean => {
        const {abc, isEditing, titleElementID, blockHeight, offsetLeft, width, titleElement} = block;
        const scoreView = this.getElement(titleElementID);
        if (!scoreView) { //コードブロックが無いとき
            return false;
        }
        scoreView.element.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));
        render(abc, parseLink(abc), titleElement.clientWidth - 30, `SVG${titleElementID}`, `PLAYER${titleElementID}`);
        return true;
    };

    public update = (newAbcBlocks: ABCBlock[], isPageTransition: boolean = false): void => {
        for (let newBlock of newAbcBlocks) {
            if (isPageTransition) {
                this.scoreViews = [];
            }
            if (!this.updateElement(newBlock)) {
                this.pushScoreView(newBlock);
            }
        }
    }
}