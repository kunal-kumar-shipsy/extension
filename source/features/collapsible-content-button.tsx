import React from 'dom-chef';
import delegate from 'delegate-it';
import { FoldDownIcon } from '@primer/octicons-react';
import * as pageDetect from 'github-url-detection';
import * as textFieldEdit from 'text-field-edit';
import * as Textarea from '../helpers/Textarea';



import features from '.';
import smartBlockWrap from '../helpers/smart-block-wrap';
import FuzzySet from 'fuzzyset';


function addContentToDetails({ delegateTarget }: delegate.Event<MouseEvent, HTMLButtonElement>): void {
	/* There's only one rich-text editor even when multiple fields are visible; the class targets it #5303 */
	const field = delegateTarget.form!.querySelector('textarea.js-comment-field')!;
	const selection = field.value.slice(field.selectionStart, field.selectionEnd);


	// Don't indent <summary> because indentation will not be automatic on multi-line content
	const newContent = `
		<details>
		<summary>Description</summary>

		Write down the issue description...
		${selection}
		</details>

		ISSUE_CODE: 
	`.replace(/(\n|\b)\t+/g, '$1').trim();

	// 	const newContent = `
	// 	${contentFormat} 
	// 	${selection}
	// `.replace(/(\n|\b)\t+/g, '$1').trim();

	field.focus();
	textFieldEdit.insert(field, smartBlockWrap(newContent, field));

	// Restore selection.
	// `selectionStart` will be right after the newly-inserted text
	field.setSelectionRange(
		field.value.lastIndexOf('</summary>', field.selectionStart) + '</summary>'.length + 2,
		field.value.lastIndexOf('</details>', field.selectionStart) - 2,
	);
}

function addButtons(textarea: any): void {
	for (const anchor of document.querySelectorAll('md-ref:not(.rgh-collapsible-content-btn-added)')) {
		anchor.classList.add('rgh-collapsible-content-btn-added');
		anchor.after(
			<button type="button" className="toolbar-item btn-octicon p-2 p-md-1 tooltipped tooltipped-sw rgh-collapsible-content-btn" aria-label="Add your comment" onClick={async () => {await getSuggestion(textarea);} }   >
				<FoldDownIcon />
			</button>
		);
	}
}


function init(): void {
	// delegate(document, '.rgh-collapsible-content-btn', 'click', getSuggestion);
	document.addEventListener('focusin', onFocus);
	// fetch('https://datausa.io/api/data?drilldowns=Nation&measures=Population')
	// .then(response => response.json())
	// .then(data => {
	// 	`contentFormat` = JSON.stringify(data)
	// 	console.log(data);
	// });

}

void features.add(import.meta.url, {
	include: [
		pageDetect.hasRichTextEditor,
	],
	deduplicate: 'has-rgh-inner',
	init
});

function isCommentTextArea(el: any): any {
	return el.nodeName === 'TEXTAREA' && (el.classList.contains('note-textarea') || el.classList.contains('comment-form-textarea'))
}
let globalSuggestionList : any;
export default async function onFocus(event: Event){
	const textarea = event.target;
	if (!textarea || !isCommentTextArea(textarea)) {
		return;
	}
	// textarea.addEventListener('keyup', event => onKeyUp(event.target));
	globalSuggestionList = await getDictionary();

	addButtons( textarea)
}

let suggestedWord = '';

function onKeyUp(textarea: any) {
	suggestedWord = '';
	if (
		!textarea ||
		!isCommentTextArea(textarea) ||
		!Textarea.reachedToIssueCode(textarea)
	) {
		//   Tooltip.remove();
		console.log("Tooltip is removed...")
		return;
	}
	suggest(textarea);
};

const suggest = (textarea: any) => {
	const suggestionList = [
		{
			code: "JS101",
			description: "Naming convention issue"
		},
		{
			code: "JS102",
			description: "Use map instead of forEach"
		},
		{
			code: "JS103",
			description: "Use indexing in table"
		},
		{
			code: "JS104",
			description: "Need to create separate function"
		}
	]
	const currentToken = Textarea.getFullTextUnderDescription(textarea);
	const currentWordList = currentToken.split(" ");
	currentWordList.forEach( (word : string) => word.trim());
	
	let words: string[] =[]
	currentWordList.forEach( (word:string) => {
		words = [...suggestionList.filter(suggestion => suggestion.description.includes(word) && word !== "").map(suggestion => suggestion.code)]
	})

	const issueCodeContent = generateIssueCodeContent(words, textarea);
	textarea.value = issueCodeContent;
};

const getDictionary: any = async () => {
	const rawSuggestionList:any = await fetch('https://reviewmanager2022.herokuapp.com/guidelines');
	
	const suggestionList = await rawSuggestionList.json();
	// return await suggestionList.map( (item:any) => {
	// 	return `${item.guideline_id} - ${item.guideline_desc}`
	// })

	return suggestionList;
}

const getSuggestion = async (textarea: any) => {
	const suggestionList = globalSuggestionList;// await getDictionary();

	const currentToken = Textarea.getFullTextUnderDescription(textarea);
	const currentWorldList: string[] = currentToken.split(" ").filter( (item:any) => item.length>3)


	const filterSuggestionList = suggestionList.filter( (item: any) => {
		const description = item.guideline_desc;
		return description.split(" ").filter( (item1:any) => item1.length>3).find( (item2: any) => currentWorldList.includes(item2))
	})


	// const fuzzySet = FuzzySet(suggestionList, false,2,3 );

	// const generatedSuggestion:any = fuzzySet.get(currentToken, 0.01);

	// console.log(generatedSuggestion, "stsctscycsycs")

	const result : any[] = []

	filterSuggestionList.forEach( (item:any) => { 
		result.push({"id": item.guideline_id, "desc": item.guideline_desc})
	});


	const issueCodeContent = generateIssueCodeContent(result, textarea);
	textarea.value = issueCodeContent;
};

const generateIssueCodeContent = (issueCodes: string[], textarea: any) => {

	let existingTextInEditor = textarea.value;
	const beforeIssueCode = existingTextInEditor.split("ISSUE CODE:")[0]

	let content = 
	`${beforeIssueCode}\n------------------------------------------------\nISSUE CODE:`;

	issueCodes.forEach( (issueCode: any) => {
		content = `${content}\n${issueCode.id} - ${issueCode.desc}`
	})

	return content;
}

