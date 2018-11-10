import * as abcjs from "abcjs/midi";

export class IMECandidate {
    private readonly index: number;
    private readonly msg: string;
    private readonly abcTextEl: HTMLTextAreaElement;
    private readonly abcContainerId: string;
    private readonly abcContainerEl: HTMLDivElement;
    private readonly div: HTMLDivElement;
    private readonly onSelected: () => void;
    private readonly messageEl: HTMLDivElement;
    private readonly highlightColor: string = "#dcf6ff";

    constructor(index: number, onSelected: () => void) {
        this.index = index;
        this.msg = `IMECandidate#${this.index}`;
        this.abcContainerId = `note-candidate-${index}`;
        this.abcContainerEl = document.createElement("div");
        this.abcContainerEl.setAttribute("id", this.abcContainerId);
        this.abcTextEl = document.createElement("textarea");
        this.abcTextEl.style.position = "absolute";
        this.abcTextEl.style.left = "-1000px";
        this.messageEl = document.createElement("div");
        this.messageEl.innerText = "Copied!";
        this.messageEl.style.display = "none";
        this.div = document.createElement("div");
        this.div.style.cursor = "pointer";
        this.div.appendChild(this.abcTextEl);
        this.div.appendChild(this.abcContainerEl);
        this.div.appendChild(this.messageEl);
        this.div.addEventListener("mouseenter", () => this.highlight(true));
        this.div.addEventListener("mouseleave", () => this.highlight(false));
        // this.div.addEventListener("click", this.onClick);
        this.onSelected = onSelected;
    }

    public getDiv = () => this.div;
    public render = (abc: string) => {
        console.log(this.msg, "render");
        abcjs.renderAbc(this.abcContainerId, abc, {responsive: "resize"});
        this.abcTextEl.value = abc;
    };
    public highlight = (isHighlight: boolean) => {
        this.div.style.backgroundColor = isHighlight ? this.highlightColor : "#fff";
    };
    // private onClick = async () => {
    //     console.log(this.msg, "onclick");
    //     await this.copyToClipboard();
    //     this.onSelected();
    // };
    // private copyToClipboard = async () => {
    //     console.log(this.msg, "copyToClipboard", `"${this.abcTextEl.value}"`);
    //     this.abcTextEl.select();
    //     document.execCommand("copy");
    //     await this.onCopied();
    // };
    // private onCopied = () => new Promise(resolve => {
    //     this.messageEl.style.height = `${this.div.clientHeight}px`;
    //     this.reset();
    //     this.messageEl.style.display = "";
    //     setTimeout(() => {
    //         this.messageEl.style.display = "none";
    //         resolve();
    //     }, 1000);
    // });
    public reset = () => {
        console.log(this.msg, "reset");
        this.abcTextEl.value = "";
        this.abcContainerEl.textContent = "";
        this.abcContainerEl.classList.remove("abcjs-container");
        this.abcContainerEl.setAttribute("style", "");
    };
}