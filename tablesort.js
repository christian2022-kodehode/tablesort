/*
 *
 *   Sort HTML tables in real-time using JavaScript - v1.0
 *   -
 *   Written by ChristianAk 2022
 *   -
 *   Known issues/limitations:
 *
 *   1. Cell attributes colspan and rowspan will likely
 *      cause incorrect sorting of adjacent columns
 *
 *   2. Column header scope attribute
 *      value of "row" is ignored
 *
 *   3. The script might fail to recognize dates or numeric data if formatted
 *      in unexpected ways (such as using different locales or including units)
 *
 *   4. Table footer rows will get sorted if
 *      they share parent with sorted rows
 *
 *   5. Script doesnt remember user sort choices
 *      (could be saved in localstorage)
 *
 *   6. Incorrect sorting might occur if order of tables
 *      in the DOM changes after the script was loaded
 *
 *
 * * * * */

// Text inside quote marks on the following 2 lines can be edited by page author:
const translationTextSortAscending = "Sort in ascending order"
const translationTextSortDescending = "Sort in descending order"



// Create interaction events and accessibility attributes on column headers
tableSortApplyEvents()
function tableSortApplyEvents() {

	const tables = document.getElementsByTagName("table")
	for (let table = 0; table < tables.length; table++) {

		// Ignore tables where page author provided data-sortable="false" attribute
		if (tables[table].dataset.sortable != "false") {

			const rows = tables[table].rows
			for (let row = 0; row < rows.length; row++) {

				// Column header rows contain at least one header cell and no data cells
				if ((rows[row].getElementsByTagName("th").length > 0) && (rows[row].getElementsByTagName("td").length === 0)) {

					const headers = rows[row].getElementsByTagName("th")
					for (let column = 0; column < headers.length; column++) {

						// Ignore column headers where page author provided data-sortable="false" attribute
						if (headers[column].dataset.sortable != "false") {

							// Add event for pointer devices
							headers[column].addEventListener("click", (event) => tableRowSort(table, column))
							
							// Add event for keyboard devices
							headers[column].addEventListener("keydown", (event) => {
								if (event.code === "Space" || event.code === "Enter") {
									tableRowSort(table, column)
								}
							})

							// Add accessibility attributes for keyboard devices and screen readers
							if (!headers[column].tabindex) headers[column].setAttribute("tabindex", 0)
							if (!headers[column].role) headers[column].setAttribute("role", "columnheader button")
							if (!headers[column].title) headers[column].setAttribute("title", translationTextSortDescending)
						}
					}
				}
			}
		}
	}
}



/*
 *   Sorting function
 *   -
 *   Called by event each time user clicks on sortable column header
 *   1. Updates sort indicators and builds index array of data rows
 *   2. Sorts index array according to column and direction
 *   3. Reorders DOM row elements according to index array
 *
 * * * * */

function tableRowSort(table, column) {

	let direction = "none"
	const tableIndex = []

	// 1. Update sort indicators and build data row index array
	const rows = document.getElementsByTagName("table")[table].rows
	for (let row = 0; row < rows.length; row++) {

		// Index content of data row
		if (rows[row].getElementsByTagName("td").length > 0) {

			let tableRowIndex = {}
			for (let column = 0; column < rows[row].cells.length; column++) {

				// Does the author want to override the sort value?
				if (rows[row].cells[column].dataset.sortvalue) {
					tableRowIndex[column] = rows[row].cells[column].dataset.sortvalue

				// Try to index cell text content
				} else if (rows[row].cells[column].innerText.length > 0) {
					tableRowIndex[column] = rows[row].cells[column].innerText.toLowerCase()

				// Otherwise index cell HTML markup, in case content is media element
				} else {
					tableRowIndex[column] = rows[row].cells[column].innerHTML.toLowerCase()
				}
			}

			tableRowIndex.element = rows[row]
			tableIndex.push(tableRowIndex)

		// Update DOM attributes of column header row
		} else if (rows[row].getElementsByTagName("th").length > 0) {

			// If sort direction already set, reverse it
			if (rows[row].cells[column].ariaSort == "descending") {

				direction = "ascending"

				// Update title DOM attribute to describe the new event action
				if (rows[row].cells[column].title == translationTextSortAscending) {
					rows[row].cells[column].setAttribute("title", translationTextSortDescending)
				}

			// Otherwise, default to "descending" 
			} else {

				direction = "descending"

				// Update title DOM attribute to describe the new event action
				if (rows[row].cells[column].title == translationTextSortDescending) {
					rows[row].cells[column].setAttribute("title", translationTextSortAscending)
				}
			}

			// Apply sort direction value to DOM aria attribute (also used for styling)
			rows[row].cells[column].ariaSort = direction

			// Reset sort direction attributes of sibling headers
			for (let columnHeader = 0; columnHeader < rows[row].cells.length; columnHeader++) {
				if (columnHeader != column) {
					rows[row].cells[columnHeader].ariaSort = "none"
				}
			}
		}
	}

	// 2. Sort index array items
	tableIndex.sort((a, b) => {
		if (direction == "descending") return arraySort(a[column], b[column])
		if (direction == "ascending") return arraySort(b[column], a[column])
	})

	function arraySort(current, next) {

		if (Number(current) || current == 0) {
			if (Number(next) || next == 0) {
				return next - current
			} else {
				if (current > next) return 1
				if (next > current) return -1
			}

		} else if ((new Date(current) !== "Invalid Date") && !isNaN(new Date(current))) {
			return new Date(current) - new Date(next)

		} else {
			if (current > next) return 1
			if (next > current) return -1
		}

		return 0
	}

	// 3. Reorder DOM elements
	for (let i = 0; i < tableIndex.length; i++) {
		if (tableIndex[i].element) {
			tableIndex[i].element.parentNode.appendChild(tableIndex[i].element)
		}
	}
}
