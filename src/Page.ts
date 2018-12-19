import {ABCBlock, ScoreElement} from "./Types";
import {generateInlineStyle} from "./Scrapbox";
import {parseLink, render} from "./ABC";

//Scrapboxページ
//ページ内に書かれた楽譜情報を管理する
export class Page {
    private scoreElements: ScoreElement[] = [];

    private pushScoreElement = (block: ABCBlock): void => {
        const {titleElementID, titleElement, blockHeight, offsetLeft, width, abc, isEditing} = block;

        //ページ遷移時、複数回pushScoreElementが実行されてしまうのでDivの重複を回避する
        const oldScoreDiv = document.querySelector(`#ABC${titleElementID}`);
        if (oldScoreDiv) oldScoreDiv.parentNode.removeChild(oldScoreDiv);

        const scoreDiv = document.createElement("div");
        scoreDiv.classList.add("scoreview");
        scoreDiv.setAttribute("id", `ABC${titleElementID}`);
        scoreDiv.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));
        scoreDiv.addEventListener("mousedown", e => {
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

        scoreDiv.appendChild(svgDiv);
        scoreDiv.appendChild(playerDiv);
        block.titleElement.appendChild(scoreDiv);
        this.scoreElements.push({
            parentElementID: titleElementID,
            element: scoreDiv
        });
        render(abc, parseLink(abc), titleElement.clientWidth - 30, svgDivID, playerDivID);
    };

    private getScoreElement = (elementID: string): ScoreElement => {
        if (this.scoreElements.length < 1) return null;
        for (let scoreElement of this.scoreElements) {
            if (scoreElement.parentElementID === elementID) {
                return scoreElement;
            }
        }
        return null;
    };

    private updateElement = (block: ABCBlock): boolean => {
        const {abc, isEditing, titleElementID, blockHeight, offsetLeft, width, titleElement} = block;
        const scoreElement = this.getScoreElement(titleElementID);
        if (!scoreElement) { //コードブロックが無いとき
            return false;
        }
        scoreElement.element.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));
        render(abc, parseLink(abc), titleElement.clientWidth - 30, `SVG${titleElementID}`, `PLAYER${titleElementID}`);
        return true;
    };

    public update = (newAbcBlocks: ABCBlock[], isPageTransition: boolean = false): void => {
        for (let newBlock of newAbcBlocks) {
            if (isPageTransition) {
                this.scoreElements = [];
            }
            if (!this.updateElement(newBlock)) {
                this.pushScoreElement(newBlock);
            }
        }
    }
}