import {ABCBlock, ScoreView} from "./Types";
import {generateInlineStyle} from "./Scrapbox";
import {getSMF, parseLink, render} from "./ABC";
import {MIDIPlayer} from "./MIDIPlayer";

//Scrapboxページ
//ページ内に書かれた楽譜情報を管理する
export class Page {
    private scoreViews: ScoreView[] = [];

    private pushScoreView = (block: ABCBlock): void => {
        const {titleElementID, titleElement, blockHeight, offsetLeft, width, abc, isEditing} = block;

        //ページ遷移時、複数回pushScoreViewが実行されてしまうのでDivの重複を回避する
        const oldScoreDiv = document.querySelector(`#ABC${titleElementID}`);
        if (oldScoreDiv) oldScoreDiv.parentNode.removeChild(oldScoreDiv);

        const scoreView = document.createElement("div");
        scoreView.classList.add("scoreview");
        scoreView.setAttribute("id", `ABC${titleElementID}`);
        scoreView.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));

        const svgDiv = document.createElement("div");
        const svgDivID = `SVG${titleElementID}`;
        svgDiv.setAttribute("id", svgDivID);

        const playerDiv = document.createElement("div");
        const playerDivID = `PLAYER${titleElementID}`;
        playerDiv.setAttribute("id", playerDivID);
        playerDiv.setAttribute("style", `visibility: hidden;`);

        scoreView.appendChild(svgDiv);
        scoreView.appendChild(playerDiv);
        block.titleElement.appendChild(scoreView);

        render(abc, parseLink(abc), titleElement.clientWidth - 30, svgDivID, playerDivID);

        const player = new MIDIPlayer(getSMF(scoreView));

        scoreView.addEventListener("mousedown", e => {
            e.stopPropagation();
            const {classList} = titleElement;
            if (!classList.contains("abcediting")) {
                classList.add("abcediting");
            }
            player.hidePlayer();
        });

        scoreView.appendChild(player.getElement());

        scoreView.addEventListener("mouseover", () => {
            player.showPlayer()
        });
        scoreView.addEventListener("mouseleave", () => {
            player.hidePlayer()
        });

        this.scoreViews.push({
            parentElementID: titleElementID,
            element: scoreView,
            player: player
        });
    };

    private getScoreViews = (elementID: string): ScoreView => {
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
        const scoreView = this.getScoreViews(titleElementID);
        if (!scoreView) { //コードブロックが無いとき
            return false;
        }
        scoreView.element.setAttribute("style", generateInlineStyle(isEditing, blockHeight, offsetLeft, width));
        render(abc, parseLink(abc), titleElement.clientWidth - 30, `SVG${titleElementID}`, `PLAYER${titleElementID}`);
        scoreView.player.load(getSMF(scoreView.element));
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