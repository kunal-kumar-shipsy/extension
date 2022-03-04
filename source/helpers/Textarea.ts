export function getFullTextUnderDescription(textarea: any):any{
  // const data = textarea?.value?.split("</summary>")?.length == 2 ? textarea?.value?.split("</summary>")[1] : ""
  // const realData = data?.split("</details>")[0].replace(/(\r\n|\n|\r|\t)/gm," ");
  return textarea?.value;
}

export function reachedToIssueCode(textarea: any){
  return textarea.value.split(/ISSUE_CODE:==>/g).length === 2;
};
