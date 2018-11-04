import * as abcjs from "abcjs/midi";

export class IMECandidate {
    private index: number;
    private id: string;
    private abcText: string;
    private abcTextEl: HTMLInputElement;
    public div: HTMLDivElement;
    constructor(index: number){
        this.index = index;
        this.id = `note-candidate-${index}`;
        this.abcTextEl = document.createElement("input");
        this.abcTextEl.style.display = "none";
        this.div = document.createElement("div");
        this.div.appendChild(this.abcTextEl);
        this.div.setAttribute("id", this.id);
        this.div.addEventListener("click", this.onClick);
    }
    render(abc: string){
        console.log(this.id, "render");
        //楽譜描画
        abcjs.renderAbc(this.id, abc, {responsive: "resize"});
        //テキスト描画
        this.abcTextEl.value = abc;
    }
    onClick(){
        console.log(this.id, "onclick");
        this.copyToClipboard()
    }
    copyToClipboard(){
        this.abcTextEl.select();
        document.execCommand("copy");
    }
    reset(){
        console.log(this.id, "reset");
        // this.div.textContent = null; //abcTextElが要素ごと消されてる
        //svgだけ消したいな
        //よくわからん
    }
}