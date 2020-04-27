class SortableTableType {
    static UNKNOWN = new SortableTableType(0);
    static VERTICAL = new SortableTableType(1);
    static HORIZONTAL = new SortableTableType(2);

    constructor(value) {
        this.value = value;
    }

    rotate() {
        switch (this) {
            case SortableTableType.VERTICAL:
                return SortableTableType.HORIZONTAL;
            case SortableTableType.HORIZONTAL:
                return SortableTableType.VERTICAL;
            default:
                throw new Error("Invalid table type");
        }
    }
}

class SortableTableElementCell {
    constructor(element, index) {
        this.element = element;
        this.index = index;
    }

    get data() {
        return this.element.text();
    }
}

class SortableTableElement {
    constructor() {
        this.cells = [];
    }

    get length() {
        return this.cells.length;
    }

    addCellElement(cellElement) {
        this.cells.push(new SortableTableElementCell(cellElement, this.cells.length));
    }

    addCellElements(cellElements) {
        cellElements.each((_, _cellElement) => {
            const cellElement = $(_cellElement);
            this.addCellElement(cellElement);
        });
    }

    getCellByIndex(index) {
        if (index < 0 || index > this.cells.length) {
            throw new Error("Invalid cell index");
        }

        return this.cells.find(c => {
            return c.index === index;
        });
    }

    getCellByElement(element) {
        if (!element) {
            throw new Error("Invalid cell element");
        }

        return this.cells.find(c => c.element.is(element));
    }

    buildRowElement() {
        const rowElement = $("<tr></tr>");
        for (const cell of this.cells) {
            rowElement.append(cell.element);
        }
        return rowElement;
    }
}

class SortableHeaderCellStatus {
    static UNSORTED = new SortableHeaderCellStatus(0, "sort-unsorted", false);
    static ASCENDING = new SortableHeaderCellStatus(1, "sort-ascending", true);
    static DESCENDING = new SortableHeaderCellStatus(2, "sort-descending", true);

    constructor(value, className, isSortable) {
        this.value = value;
        this.className = className;
        this.isSortable = isSortable;
    }

    get next() {
        switch (this) {
            case SortableHeaderCellStatus.UNSORTED:
                return SortableHeaderCellStatus.ASCENDING;
            case SortableHeaderCellStatus.ASCENDING:
                return SortableHeaderCellStatus.DESCENDING;
            case SortableHeaderCellStatus.DESCENDING:
                return SortableHeaderCellStatus.UNSORTED;
        }
    }
}

class SortableTableHeaderCell extends SortableTableElementCell {
    constructor(element, index) {
        super(element, index);

        element.click(() => {
            this.toggleSortStatus();
        });

        this.sortStatus = SortableHeaderCellStatus.UNSORTED;
        this.sortFn = this.defaultSortFn;
        this.sortStatusListener = () => {};
    }

    setSortStatus(newStatus, report=true) {
        const oldStatus = this.sortStatus;
        this.element.removeClass(oldStatus.className);
        this.element.addClass(newStatus.className);
        this.sortStatus = newStatus;
        if (report) {
            this.sortStatusListener(this, newStatus);
        }
    }

    defaultSortFn(firstData, secondData) {
        if (firstData < secondData) {
            return -1;
        }

        if (secondData < firstData) {
            return 1;
        }

        return 0;
    }

    toggleSortStatus(report) {
        const newStatus = this.sortStatus.next;
        this.setSortStatus(newStatus, report);
    }

    resetSortStatus(report) {
        this.setSortStatus(SortableHeaderCellStatus.UNSORTED, report);
    }
}

class SortableTableHeader extends SortableTableElement {
    constructor() {
        super();

        this.sortStatusListener = () => {};
    }

    addCellElement(cellElement) {
        const cell = new SortableTableHeaderCell(cellElement, this.cells.length);
        cell.sortStatusListener = this.onCellSortStatusChange.bind(this);
        this.cells.push(cell);
    }

    onCellSortStatusChange(cell) {
        if (cell.sortStatus !== SortableHeaderCellStatus.UNSORTED) {
            for (const c of this.cells) {
                if (c !== cell) {
                    c.resetSortStatus(false)
                }
            }
        }
        this.sortStatusListener(cell);
    }

    get sortableCell() {
        return this.cells.find(c => c.sortStatus.isSortable);
    }
}

class SortableTable {
    constructor(tableElement) {
        this.tableElement = tableElement;
        this.type = SortableTableType.UNKNOWN;

        this.elements = [];
        this.header = null;
        this.extractElements();

        this.header.sortStatusListener = () => {
            this.refreshElements();
        };
    }

    extractElements() {
        const rowElements = this.tableElement.find("tr");
        rowElements.each((_, _rowElement) => {
            const rowElement = $(_rowElement);
            const cellElements = rowElement.find("th, td");
            const dataElements = rowElement.find("td");
            const headerElements = rowElement.find("th");
            const isFirstRow = this.type === SortableTableType.UNKNOWN;
            let type = SortableTableType.UNKNOWN;

            if (headerElements.length === 1 && headerElements[0] === cellElements[0] &&
                    dataElements.length !== 0) {
                type = SortableTableType.VERTICAL;
            } else if ((isFirstRow && headerElements.length > 0 && dataElements.length === 0) ||
                    (!isFirstRow && headerElements.length === 0 && dataElements.length > 0)) {
                type = SortableTableType.HORIZONTAL;
            }

            if (type === SortableTableType.UNKNOWN || (!isFirstRow && this.type !== type)) {
                throw new Error("Invalid table type." +
                    "For a vertical table type, the first cell of each row must be a header cell, " +
                    "and the rest of the cells must be data cells.\n" +
                    "For a horizontal table type, the first row must only contain header cells, " +
                    "and the rest of the rows must only contain data cells");
            }

            if (type === SortableTableType.VERTICAL) {
                if (isFirstRow) {
                    this.header = new SortableTableHeader();
                    dataElements.each((_, __) => {
                        this.elements.push(new SortableTableElement());
                    });
                }

                const headerElement = $(headerElements[0]);
                this.header.addCellElement(headerElement);
                dataElements.each((cellIndex, _cellElement) => {
                    const cellElement = $(_cellElement);
                    this.elements[cellIndex].addCellElement(cellElement);
                });
            } else if (type === SortableTableType.HORIZONTAL) {
                let element;
                if (isFirstRow) {
                    this.header = element = new SortableTableHeader();
                } else {
                    element = new SortableTableElement();
                    this.elements.push(element);
                }

                element.addCellElements(cellElements);
            }

            this.type = type;
        });
    }

    emptyTable() {
        this.tableElement.children().detach();
    }

    populateTable(elements) {
        this.emptyTable();

        if (this.type === SortableTableType.VERTICAL) {
            for (let index = 0; index < this.header.length; index++) {
                const rowElement = $("<tr></tr>");
                rowElement.append(this.header.getCellByIndex(index).element);
                for (const element of elements) {
                    rowElement.append(element.getCellByIndex(index).element);
                }
                this.tableElement.append(rowElement);
            }
        } else if (this.type === SortableTableType.HORIZONTAL) {
            this.tableElement.append(this.header.buildRowElement());
            for (const element of elements) {
                this.tableElement.append(element.buildRowElement());
            }
        }
    }

    getElementsSortedByCell(cell) {
        const elements = this.elements.slice();

        if (!cell) {
            return elements
        }

        elements.sort((firstElement, secondElement) => {
            return cell.sortFn(firstElement.getCellByIndex(cell.index).data,
                    secondElement.getCellByIndex(cell.index).data);
        });

        if (cell.sortStatus === SortableHeaderCellStatus.DESCENDING) {
            elements.reverse();
        }

        return elements;
    }

    refreshElements() {
        const sortedElements = this.getElementsSortedByCell(this.header.sortableCell);
        this.populateTable(sortedElements);
    }

    rotateTable() {
        this.type = this.type.rotate();
        this.refreshElements();
    }

    setCellSortFunction(cellElement, fn) {
        const cell = this.header.getCellByElement(cellElement);
        if (!cell) {
            throw new Error("Cell element is not part of the table header");
        }

        cell.sortFn = fn;
    }
}
