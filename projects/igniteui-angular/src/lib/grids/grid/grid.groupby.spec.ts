﻿import { Component, ViewChild, TemplateRef } from '@angular/core';
import { async, fakeAsync, TestBed, tick, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxStringFilteringOperand } from '../../data-operations/filtering-condition';
import { ISortingExpression, SortingDirection } from '../../data-operations/sorting-expression.interface';
import { IgxColumnComponent } from '../column.component';
import { IgxGridComponent } from './grid.component';
import { IgxGroupAreaDropDirective } from './grid.directives';
import { IgxColumnMovingDragDirective } from '../grid.common';
import { IgxGridGroupByRowComponent } from './groupby-row.component';
import { IgxGridModule, IgxGridCellComponent } from './index';
import { IgxGridRowComponent } from './grid-row.component';
import { IgxChipComponent, IChipClickEventArgs } from '../../chips/chip.component';
import { wait, UIInteractions } from '../../test-utils/ui-interactions.spec';
import { HelperUtils } from '../../test-utils/helper-utils.spec';
import { DefaultSortingStrategy } from '../../data-operations/sorting-strategy';
import { configureTestSuite } from '../../test-utils/configure-suite';
import { DataParent } from '../../test-utils/sample-test-data.spec';
import { MultiColumnHeadersWithGroupingComponent } from '../../test-utils/grid-samples.spec';

describe('IgxGrid - GroupBy', () => {
    configureTestSuite();
    const COLUMN_HEADER_CLASS = '.igx-grid__th';
    const COLUMN_HEADER_GROUP_CLASS = '.igx-grid__thead-item';
    const CELL_CSS_CLASS = '.igx-grid__td';
    const SORTING_ICON_ASC_CONTENT = 'arrow_upward';
    const SORTING_ICON_DESC_CONTENT = 'arrow_downward';
    const SUMMARY_LABEL_CLASS = '.igx-grid-summary__label';
    const SUMMARY_VALUE_CLASS = '.igx-grid-summary__result';
    const DISABLED_CHIP = 'igx-chip--disabled';
    const CHIP_REMOVE_ICON = '.igx-chip__remove';
    const CHIP = 'igx-chip';

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                DefaultGridComponent,
                GroupableGridComponent,
                CustomTemplateGridComponent,
                GroupByDataMoreColumnsComponent,
                MultiColumnHeadersWithGroupingComponent
            ],
            imports: [NoopAnimationsModule, IgxGridModule.forRoot()]
        }).compileComponents();
    }));

    function checkGroups(groupRows, expectedGroupOrder, grExpr?) {
        // verify group rows are sorted correctly, their indexes in the grid are correct and their group records match the group value.
        let count = 0;
        const maxLevel = grExpr ? grExpr.length - 1 : 0;
        for (const groupRow of groupRows) {
            const recs = groupRow.groupRow.records;
            const val = groupRow.groupRow.value;
            const index = groupRow.index;
            const field = groupRow.groupRow.expression.fieldName;
            const level = groupRow.groupRow.level;
            expect(level).toEqual(grExpr ? grExpr.indexOf(groupRow.groupRow.expression) : 0);
            expect(index).toEqual(count);
            count++;
            expect(val).toEqual(expectedGroupOrder[groupRows.indexOf(groupRow)]);
            for (const rec of recs) {
                if (level === maxLevel) {
                    count++;
                }
                expect(rec[field]).toEqual(val);
            }
        }
    }

    function checkChips(chips, grExpr, sortExpr) {
        for (let i = 0; i < chips.length; i++) {
            const chip = chips[i].querySelector('div.igx-chip__content').innerText;
            const chipDirection = chips[i].querySelector('[igxsuffix]').innerText;
            const grp = grExpr[i];
            const s = sortExpr[i];
            expect(chip).toBe(grp.fieldName);
            expect(chip).toBe(s.fieldName);
            if (chipDirection === SORTING_ICON_ASC_CONTENT) {
                expect(grp.dir).toBe(SortingDirection.Asc);
                expect(s.dir).toBe(SortingDirection.Asc);
            } else {
                expect(grp.dir).toBe(SortingDirection.Desc);
                expect(s.dir).toBe(SortingDirection.Desc);
            }
        }
    }

    it('should allow grouping by different data types.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        // group by string column
        const grid = fix.componentInstance.instance;
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        // verify grouping expressions
        const grExprs = grid.groupingExpressions;
        expect(grExprs.length).toEqual(1);
        expect(grExprs[0].fieldName).toEqual('ProductName');

        // verify rows
        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);

        checkGroups(groupRows, ['NetAdvantage', 'Ignite UI for JavaScript', 'Ignite UI for Angular', '', null]);
        // ungroup
        grid.clearGrouping('ProductName');
        tick();

        fix.detectChanges();

        // verify no groups are present
        expect(grid.groupsRowList.toArray().length).toEqual(0);

        // group by number
        grid.groupBy({
            fieldName: 'Downloads', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(6);
        expect(dataRows.length).toEqual(8);

        checkGroups(groupRows, [1000, 254, 100, 20, 0, null]);

        // ungroup and group by boolean column
        grid.clearGrouping('Downloads');
        tick();
        fix.detectChanges();
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        checkGroups(groupRows, [true, false, null]);

        // ungroup and group by date column
        grid.clearGrouping('Released');
        tick();
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ReleaseDate', dir: SortingDirection.Asc, ignoreCase: false
        });
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(4);
        expect(dataRows.length).toEqual(8);

        const expectedValue1 = groupRows[1].nativeElement.nextElementSibling.querySelectorAll('igx-grid-cell')[3].textContent;
        const actualValue1 = groupRows[1].element.nativeElement.querySelector('.igx-group-label__text').textContent;
        const expectedValue2 = groupRows[2].nativeElement.nextElementSibling.querySelectorAll('igx-grid-cell')[3].textContent;
        const actualValue2 = groupRows[2].element.nativeElement.querySelector('.igx-group-label__text').textContent;
        const expectedValue3 = groupRows[3].nativeElement.nextElementSibling.querySelectorAll('igx-grid-cell')[3].textContent;
        const actualValue3 = groupRows[3].element.nativeElement.querySelector('.igx-group-label__text').textContent;

        expect(actualValue1).toEqual(expectedValue1);
        expect(actualValue2).toEqual(expectedValue2);
        expect(actualValue3).toEqual(expectedValue3);

        checkGroups(
            groupRows,
            [null, fix.componentInstance.prevDay, fix.componentInstance.today, fix.componentInstance.nextDay]);
    }));

    it('should allow grouping by multiple columns.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.componentInstance.height = null;
        tick();
        fix.detectChanges();

        // group by 2 columns
        const grid = fix.componentInstance.instance;
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        // verify groups and data rows count
        expect(groupRows.length).toEqual(13);
        expect(dataRows.length).toEqual(8);
        // verify groups
        checkGroups(groupRows,
            ['NetAdvantage', true, false, 'Ignite UI for JavaScript', true,
                false, 'Ignite UI for Angular', false, null, '', true, null, true],
            grid.groupingExpressions);

        // group by 3rd column

        grid.groupBy({
            fieldName: 'Downloads', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        // verify groups and data rows count
        expect(groupRows.length).toEqual(21);
        expect(dataRows.length).toEqual(8);
        // verify groups
        checkGroups(groupRows,
            ['NetAdvantage', true, 1000, false, 1000, 'Ignite UI for JavaScript', true, null, false, 254, 'Ignite UI for Angular',
                false, 20, null, 1000, '', true, 100, null, true, 0],
            grid.groupingExpressions);
    }));

    it('should allow grouping with a custom comparer', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.componentInstance.data[0].ReleaseDate = new Date(2017, 1, 1, 15, 30, 0, 0);
        fix.componentInstance.data[1].ReleaseDate = new Date(2017, 1, 1, 20, 30, 0, 0);
        fix.componentInstance.height = null;
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ReleaseDate',
            dir: SortingDirection.Desc,
            groupingComparer: (a: Date, b: Date) => {
                if (a instanceof Date && b instanceof Date &&
                    a.getFullYear() === b.getFullYear() &&
                    a.getMonth() === b.getMonth() &&
                    a.getDate() === b.getDate()) {
                    return 0;
                }
                return DefaultSortingStrategy.instance().compareValues(a, b);
            }
        });
        fix.detectChanges();
        let groupRows = grid.groupsRowList.toArray();
        // verify groups count
        expect(groupRows.length).toEqual(5);
        // now click the chip to change sorting, the grouping expression should hold
        // the comparer and reapply the same grouping again
        let chips = fix.nativeElement.querySelectorAll('igx-chip');
        // click grouping direction arrow
        const event: IChipClickEventArgs = { owner: chips[0], cancel: false, originalEvent: null };
        grid.onChipClicked(event);
        chips = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chips.length).toBe(1);
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);
        expect(chips[0].querySelector('igx-icon').innerText.trim()).toBe('arrow_upward');
        groupRows = grid.groupsRowList.toArray();
        expect(groupRows.length).toEqual(5);
    });

    it('should allows expanding/collapsing groups.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();
        // verify groups and data rows count
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        // toggle grouprow - collapse
        expect(groupRows[0].expanded).toEqual(true);
        grid.toggleGroup(groupRows[0].groupRow);
        tick();
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(false);
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(4);
        // verify collapsed group sub records are not rendered

        for (const rec of groupRows[0].groupRow.records) {
            expect(grid.getRowByKey(rec.ID)).toBeUndefined();
        }

        // toggle grouprow - expand
        grid.toggleGroup(groupRows[0].groupRow);
        tick();
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(true);
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        // verify expanded group sub records are rendered
        for (const rec of groupRows[0].groupRow.records) {
            expect(grid.getRowByKey(rec.ID)).not.toBeUndefined();
        }
    }));

    it('should allow changing the order of the groupBy columns.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        // set groupingExpressions
        const grid = fix.componentInstance.instance;
        const exprs: ISortingExpression[] = [
            { fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: true },
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: true }
        ];
        grid.groupingExpressions = exprs;
        tick();
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(13);
        expect(dataRows.length).toEqual(8);
        // verify groups
        checkGroups(groupRows,
            ['NetAdvantage', true, false, 'Ignite UI for JavaScript', true,
                false, 'Ignite UI for Angular', false, null, '', true, null, true],
            grid.groupingExpressions);

        // change order
        grid.groupingExpressions = [
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: true },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: true }
        ];
        tick();
        grid.sortingExpressions = [
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: true },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: true }
        ];
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(11);
        expect(dataRows.length).toEqual(8);
        // verify groups
        checkGroups(groupRows,
            [null, 'Ignite UI for Angular', false, 'Ignite UI for Angular', 'Ignite UI for JavaScript',
                'NetAdvantage', true, null, '', 'Ignite UI for JavaScript', 'NetAdvantage'],
            grid.groupingExpressions);
    }));

    it('should allow setting expand/collapse state', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();

        grid.groupsExpanded = false;
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(0);

        for (const grRow of groupRows) {
            expect(grRow.expanded).toBe(false);
        }

        grid.groupsExpanded = true;
        tick();
        grid.cdr.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        for (const grRow of groupRows) {
            expect(grRow.expanded).toBe(true);
        }
    }));

    it('should trigger an onGroupingDone event when a column is grouped with the correct params.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();

        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        const currExpr = fix.componentInstance.currentSortExpressions;
        expect(currExpr.expressions.length).toEqual(1);
        expect(currExpr.expressions[0].fieldName).toEqual('Released');
        expect(currExpr.groupedColumns.length).toEqual(1);
        expect(currExpr.groupedColumns[0].field).toEqual('Released');
        expect(currExpr.ungroupedColumns.length).toEqual(0);
    }));

    it('should trigger an onGroupingDone event when a column is ungrouped with the correct params.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false },
            { fieldName: 'ReleaseDate', dir: SortingDirection.Desc, ignoreCase: false }
        ]);
        tick();
        fix.detectChanges();
        grid.clearGrouping('Released');
        tick();
        fix.detectChanges();
        const currExpr = fix.componentInstance.currentSortExpressions;
        expect(currExpr.expressions.length).toEqual(1);
        expect(currExpr.expressions[0].fieldName).toEqual('ReleaseDate');
        expect(currExpr.groupedColumns.length).toEqual(0);
        expect(currExpr.ungroupedColumns.length).toEqual(1);
        expect(currExpr.ungroupedColumns[0].field).toEqual('Released');
    }));

    it('should trigger an onGroupingDone event when multiple columns are grouped with the correct params.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();
        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ReleaseDate', dir: SortingDirection.Desc, ignoreCase: false }
        ]);
        tick();
        fix.detectChanges();
        const currExpr = fix.componentInstance.currentSortExpressions;
        expect(currExpr.expressions.length).toEqual(3);
        expect(currExpr.expressions[0].fieldName).toEqual('Released');
        expect(currExpr.expressions[1].fieldName).toEqual('ProductName');
        expect(currExpr.expressions[2].fieldName).toEqual('ReleaseDate');
        expect(currExpr.groupedColumns.length).toEqual(3);
        expect(currExpr.groupedColumns[0].field).toEqual('Released');
        expect(currExpr.groupedColumns[1].field).toEqual('ProductName');
        expect(currExpr.groupedColumns[2].field).toEqual('ReleaseDate');
        expect(currExpr.ungroupedColumns.length).toEqual(0);
    }));

    it('should trigger an onGroupingDone event when multiple columns are ungrouped with the correct params.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();
        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false },
            { fieldName: 'ReleaseDate', dir: SortingDirection.Desc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        tick();
        fix.detectChanges();
        grid.clearGrouping(['Released', 'ProductName', 'Downloads']);
        tick();
        fix.detectChanges();
        const currExpr = fix.componentInstance.currentSortExpressions;
        expect(currExpr.expressions.length).toEqual(1);
        expect(currExpr.expressions[0].fieldName).toEqual('ReleaseDate');
        expect(currExpr.groupedColumns.length).toEqual(0);
        expect(currExpr.ungroupedColumns.length).toEqual(3);
        expect(currExpr.ungroupedColumns[0].field).toEqual('Released');
        expect(currExpr.ungroupedColumns[1].field).toEqual('ProductName');
        expect(currExpr.ungroupedColumns[2].field).toEqual('Downloads');
    }));

    it(`should trigger an onGroupingDone event when the user pushes a new array of grouping expressions, which results in
    both grouping and ungrouping at the same time.`, fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            grid.primaryKey = 'ID';
            fix.detectChanges();
            grid.groupBy([
                { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false },
                { fieldName: 'ReleaseDate', dir: SortingDirection.Desc, ignoreCase: false },
                { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
            ]);
            tick();
            fix.detectChanges();
            const newExpressions = [
                { fieldName: 'ReleaseDate', dir: SortingDirection.Desc, ignoreCase: false },
                { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false },
                { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false }
            ];
            grid.groupingExpressions = newExpressions;
            tick();
            fix.detectChanges();
            const currExpr = fix.componentInstance.currentSortExpressions;
            expect(currExpr.expressions.length).toEqual(3);
            expect(currExpr.expressions[0].fieldName).toEqual('ReleaseDate');
            expect(currExpr.expressions[1].fieldName).toEqual('ProductName');
            expect(currExpr.expressions[2].fieldName).toEqual('Downloads');
            expect(currExpr.ungroupedColumns.length).toEqual(1);
            expect(currExpr.ungroupedColumns[0].field).toEqual('Released');
            expect(currExpr.groupedColumns.length).toEqual(1);
            expect(currExpr.groupedColumns[0].field).toEqual('Downloads');
        }));

    it('should allow setting custom template for group row content.', fakeAsync(() => {
        const fix = TestBed.createComponent(CustomTemplateGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();

        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        const groupRows = grid.groupsRowList.toArray();

        for (const grRow of groupRows) {
            const elem = grRow.groupContent.nativeElement;
            const grVal = grRow.groupRow.value === null ? '' : grRow.groupRow.value.toString();
            const expectedText = 'Total items with value:' + grVal +
                ' are ' + grRow.groupRow.records.length;
            expect(elem.innerText.trim(['\n', '\r', ' '])).toEqual(expectedText);
        }
    }));

    it('should have the correct ARIA attributes on the group rows.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();

        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        const groupRows = grid.groupsRowList.toArray();
        for (const grRow of groupRows) {
            const elem = grRow.element.nativeElement;
            expect(elem.attributes['aria-describedby'].value).toEqual(grid.id + '_Released');
            expect(elem.attributes['aria-expanded'].value).toEqual('true');
        }
    }));

    // GroupBy + Sorting integration
    it('should apply sorting on each group\'s records when non-grouped column is sorted.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        tick();
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();
        const groupRows = grid.groupsRowList.toArray();
        const dataRows = grid.dataRowList.toArray();
        // verify groups and data rows count
        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);

        grid.sort({ fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false });
        fix.detectChanges();

        // verify groups
        checkGroups(groupRows, ['NetAdvantage', 'Ignite UI for JavaScript', 'Ignite UI for Angular', '', null]);

        // verify data records order
        const expectedDataRecsOrder = [false, true, false, true, null, false, true, true];
        dataRows.forEach((row, index) => {
            expect(row.rowData.Released).toEqual(expectedDataRecsOrder[index]);
        });

    }));

    it('should apply the specified sort order on the group rows when already grouped columnn is sorted in asc/desc order.',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            fix.componentInstance.enableSorting = true;
            fix.detectChanges();
            grid.groupBy({
                fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
            });
            fix.detectChanges();

            let groupRows = grid.groupsRowList.toArray();
            let dataRows = grid.dataRowList.toArray();

            // verify groups and data rows count
            expect(groupRows.length).toEqual(5);
            expect(dataRows.length).toEqual(8);

            // verify group order
            checkGroups(groupRows, ['NetAdvantage', 'Ignite UI for JavaScript', 'Ignite UI for Angular', '', null]);
            grid.sort({
                fieldName: 'ProductName',
                dir: SortingDirection.Asc,
                ignoreCase: false
            });
            fix.detectChanges();

            groupRows = grid.groupsRowList.toArray();
            dataRows = grid.dataRowList.toArray();

            // verify group order
            checkGroups(groupRows, [null, '', 'Ignite UI for Angular', 'Ignite UI for JavaScript', 'NetAdvantage']);

        }));

    it('should remove grouping when already grouped columnn is sorted with order "None" via the API.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        // verify groups and data rows count
        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);

        // verify group order
        checkGroups(groupRows, ['NetAdvantage', 'Ignite UI for JavaScript', 'Ignite UI for Angular', '', null]);
        grid.sort({ fieldName: 'ProductName', dir: SortingDirection.None, ignoreCase: false });
        fix.detectChanges();
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        // verify groups and data rows count
        expect(groupRows.length).toEqual(0);
        expect(dataRows.length).toEqual(8);

    }));

    it('should disallow setting sorting state None to grouped column when sorting via the UI.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'Downloads', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        // click header
        headers[0].triggerEventHandler('click', new Event('click'));
        tick();
        fix.detectChanges();

        const sortingIcon = fix.debugElement.query(By.css('.sort-icon'));
        expect(sortingIcon.nativeElement.textContent.trim()).toEqual(SORTING_ICON_ASC_CONTENT);

        // click header again
        headers[0].triggerEventHandler('click', new Event('click'));
        tick();
        fix.detectChanges();

        expect(sortingIcon.nativeElement.textContent.trim()).toEqual(SORTING_ICON_DESC_CONTENT);

        // click header again
        headers[0].triggerEventHandler('click', new Event('click'));
        tick();
        fix.detectChanges();
        expect(sortingIcon.nativeElement.textContent.trim()).toEqual(SORTING_ICON_ASC_CONTENT);

    }));

    it('should group by the specified field when grouping by an already sorted field.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();
        grid.sort({ fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        });
        fix.detectChanges();
        const groupRows = grid.groupsRowList.toArray();
        // verify group order
        checkGroups(groupRows, [null, '', 'Ignite UI for Angular', 'Ignite UI for JavaScript', 'NetAdvantage']);
    }));

    it('should allow grouping of already sorted column', async(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();
        grid.sort({ fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();
        const groupRows = grid.groupsRowList.toArray();
        const dataRows = grid.dataRowList.toArray();
        // verify groups and data rows count
        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);
        expect(grid.groupingExpressions.length).toEqual(1);
    }));

    // GroupBy + Virtualization integration
    it('should virtualize data and group records.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;

        fix.componentInstance.width = '600px';
        fix.componentInstance.height = '300px';
        grid.columnWidth = '200px';
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        expect(grid.groupsRowList.toArray().length).toEqual(3);
        expect(grid.dataRowList.toArray().length).toEqual(2);
        expect(grid.rowList.toArray().length).toEqual(5);
    }));

    it('should recalculate visible chunk data and scrollbar size when expanding/collapsing group rows.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;

        fix.componentInstance.width = '600px';
        tick();
        fix.componentInstance.height = '300px';
        tick();
        grid.columnWidth = '200px';
        tick();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        const origScrollHeight = parseInt(grid.verticalScrollContainer.getVerticalScroll().children[0].style.height, 10);

        // collapse all group rows currently in the view
        const grRows = grid.groupsRowList.toArray();
        grRows[0].toggle();
        tick();
        fix.detectChanges();

        // verify rows are updated
        expect(grid.groupsRowList.toArray().length).toEqual(4);
        expect(grid.dataRowList.toArray().length).toEqual(1);
        expect(grid.rowList.toArray().length).toEqual(5);

        // verify scrollbar is updated - 4 rows x 50px are hidden.
        expect(parseInt(grid.verticalScrollContainer.getVerticalScroll().children[0].style.height, 10))
            .toEqual(origScrollHeight - 200);

        grRows[0].toggle();
        tick();
        fix.detectChanges();

        expect(grid.groupsRowList.toArray().length).toEqual(3);
        expect(grid.dataRowList.toArray().length).toEqual(2);
        expect(grid.rowList.toArray().length).toEqual(5);

        expect(parseInt(grid.verticalScrollContainer.getVerticalScroll().children[0].style.height, 10))
            .toEqual(origScrollHeight);
    }));

    it('should persist group row expand/collapse state when scrolling.', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;

        fix.componentInstance.width = '500px';
        fix.componentInstance.height = '300px';
        grid.columnWidth = '200px';
        await wait();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        let groupRow = grid.groupsRowList.toArray()[0];
        groupRow.toggle();
        await wait();

        expect(groupRow.expanded).toBe(false);
        fix.detectChanges();

        // scroll to bottom
        grid.verticalScrollContainer.getVerticalScroll().scrollTop = 10000;
        await wait(100);
        fix.detectChanges();

        // scroll back to the top
        grid.verticalScrollContainer.getVerticalScroll().scrollTop = 0;
        await wait(100);
        fix.detectChanges();

        groupRow = grid.groupsRowList.toArray()[0];

        expect(groupRow.expanded).toBe(false);
    });

    it('should leave group rows static when scrolling horizontally.', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;

        fix.componentInstance.width = '400px';
        fix.componentInstance.height = '300px';
        grid.columnWidth = '200px';
        await wait();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();
        const groupRow = grid.groupsRowList.toArray()[0];
        const origRect = groupRow.element.nativeElement.getBoundingClientRect();
        grid.parentVirtDir.getHorizontalScroll().scrollLeft = 1000;
        await wait(100);
        fix.detectChanges();

        const rect = groupRow.element.nativeElement.getBoundingClientRect();

        // verify row location is the same
        expect(rect.left).toEqual(origRect.left);
        expect(rect.top).toEqual(origRect.top);
    });

    // GroupBy + Filtering
    it('should filters by the data records and renders their related groups.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '1200px';
        tick();
        grid.columnWidth = '200px';
        tick();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);
        expect(grid.rowList.toArray().length).toEqual(13);

        fix.detectChanges();
        grid.filter('ProductName', 'Ignite', IgxStringFilteringOperand.instance().condition('contains'), true);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(4);
        expect(grid.rowList.toArray().length).toEqual(6);
    }));

    // GroupBy + RowSelectors
    it('should not render row selectors in group row.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '1200px';
        tick();
        grid.columnWidth = '200px';
        tick();
        grid.rowSelectable = true;
        tick();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });

        fix.detectChanges();

        const grRows = grid.groupsRowList.toArray();
        const dataRows = grid.dataRowList.toArray();
        for (const grRow of grRows) {
            const checkBoxElement = grRow.element.nativeElement.querySelector('div.igx-grid__cbx-selection');
            expect(checkBoxElement).toBeNull();
        }
        for (const dRow of dataRows) {
            const checkBoxElement = dRow.element.nativeElement.querySelector('div.igx-grid__cbx-selection');
            expect(checkBoxElement).toBeDefined();
        }
    }));

    it('should not select group rows when selectAll API is called or when header checkbox is clicked.',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            fix.componentInstance.width = '1200px';
            tick();
            grid.columnWidth = '200px';
            tick();
            grid.rowSelectable = true;
            tick();
            fix.detectChanges();

            grid.groupBy({
                fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
            });

            fix.detectChanges();

            grid.selectAllRows();
            tick();

            fix.detectChanges();

            let selRows = grid.selectedRows();
            tick();
            expect(selRows.length).toEqual(8);

            let rows = fix.debugElement.queryAll(By.css('.igx-grid__tr--selected'));
            for (const r of rows) {
                expect(r.componentInstance instanceof IgxGridRowComponent).toBe(true);
            }

            grid.deselectAllRows();
            tick();
            fix.detectChanges();
            selRows = grid.selectedRows();
            expect(selRows.length).toEqual(0);

            const headerRow: HTMLElement = fix.nativeElement.querySelector('.igx-grid__thead');
            const headerCheckboxElement: Element = headerRow.querySelector('.igx-checkbox__input');
            headerCheckboxElement.dispatchEvent(new Event('click'));
            tick();
            fix.detectChanges();

            selRows = grid.selectedRows();
            expect(selRows.length).toEqual(8);

            rows = fix.debugElement.queryAll(By.css('.igx-grid__tr--selected'));
            for (const r of rows) {
                expect(r.componentInstance instanceof IgxGridRowComponent).toBe(true);
            }

        }));

    // GroupBy + Resizing
    it('should retain same size for group row after a column is resized.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '1200px';
        fix.componentInstance.enableResizing = true;
        grid.columnWidth = '200px';
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        let grRows = grid.groupsRowList.toArray();
        for (const grRow of grRows) {
            expect(grRow.element.nativeElement.clientWidth).toEqual(1200);
        }

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_GROUP_CLASS));
        const headerResArea = headers[0].children[1].nativeElement;
        UIInteractions.simulateMouseEvent('mouseover', headerResArea, 200, 5);
        UIInteractions.simulateMouseEvent('mousedown', headerResArea, 200, 5);
        UIInteractions.simulateMouseEvent('mouseup', headerResArea, 200, 5);
        tick(100);
        fix.detectChanges();
        UIInteractions.simulateMouseEvent('mousedown', headerResArea, 200, 5);
        tick(100);
        fix.detectChanges();

        const resizer = headers[0].children[1].children[0].nativeElement;
        expect(resizer).toBeDefined();
        UIInteractions.simulateMouseEvent('mousemove', resizer, 550, 5);
        tick(100);

        UIInteractions.simulateMouseEvent('mouseup', resizer, 550, 5);
        tick();
        fix.detectChanges();

        expect(grid.columns[0].width).toEqual('550px');

        grRows = grid.groupsRowList.toArray();
        for (const grRow of grRows) {
            expect(grRow.element.nativeElement.clientWidth).toEqual(1200);
        }
    }));

    // GroupBy + Hiding
    it('should retain same size for group row after a column is hidden.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '1200px';
        tick();
        grid.columnWidth = '200px';
        tick();
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        grid.getColumnByName('ProductName').hidden = true;
        tick();
        grid.getColumnByName('Released').hidden = true;
        tick();

        fix.detectChanges();

        const grRows = grid.groupsRowList.toArray();
        for (const grRow of grRows) {
            expect(grRow.element.nativeElement.clientWidth).toEqual(1200);
        }
    }));

    // GroupBy + Pinning
    it('should retain same size for group row after a column is pinned.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '500px';
        tick();
        grid.columnWidth = '200px';
        tick();
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        grid.pinColumn('ProductName');
        tick();

        fix.detectChanges();
        const grRows = grid.groupsRowList.toArray();
        for (const grRow of grRows) {
            expect(grRow.element.nativeElement.clientWidth).toEqual(500);
        }
    }));

    // GroupBy + Updating
    it('should update the UI when adding/deleting/updating records via the API so that they more to the correct group.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.width = '500px';
        grid.columnWidth = '200px';
        grid.primaryKey = 'ID';
        fix.detectChanges();
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        // verify rows
        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(8);

        // add records
        grid.addRow({
            Downloads: 0,
            ID: 1010,
            ProductName: 'Ignite UI for Everyone',
            ReleaseDate: new Date(),
            Released: false
        });
        tick();
        fix.detectChanges();
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(6);
        expect(dataRows.length).toEqual(9);

        // update records
        grid.updateRow({ ID: 1010, ProductName: 'Ignite UI for Angular' }, 1010);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(5);
        expect(dataRows.length).toEqual(9);

        grid.deleteRow(1010);
        tick();
        fix.detectChanges();
        grid.deleteRow(3);
        tick();
        fix.detectChanges();
        grid.deleteRow(6);
        tick();
        fix.detectChanges();
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(4);
        expect(dataRows.length).toEqual(6);
    }));

    // tslint:disable-next-line:max-line-length
    it('should update the UI when updating records via the UI after grouping is re-applied so that they more to the correct group', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableEditing = true;
        fix.componentInstance.width = '800px';
        grid.columnWidth = '200px';
        grid.primaryKey = 'ID';
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        const rv = grid.getRowByKey(5).element.nativeElement.querySelectorAll(CELL_CSS_CLASS)[2];
        const cell = grid.getCellByKey(5, 'ProductName');

        cell.column.editable = true;
        rv.dispatchEvent(new Event('focus'));
        rv.dispatchEvent(new Event('dblclick'));
        await wait();
        fix.detectChanges();

        expect(cell.inEditMode).toBe(true);

        const editCellDom = fix.debugElement.query(By.css('.igx-grid__td--editing'));
        const input = editCellDom.query(By.css('input'));

        sendInput(input, 'NetAdvantage', fix);
        await wait();

        UIInteractions.triggerKeyDownEvtUponElem('enter', editCellDom.nativeElement, true);
        await wait(30);
        fix.detectChanges();

        const groupRows = grid.groupsRowList.toArray();
        const dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(4);
        expect(dataRows.length).toEqual(8);
    });

    // GroupBy + Paging integration
    it('should apply paging on data records only.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.instance.paging = true;
        tick();
        fix.componentInstance.instance.perPage = 3;
        tick();
        fix.detectChanges();
        fix.componentInstance.instance.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        const groupRows = grid.groupsRowList.toArray();
        const dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(3);

        expect(groupRows[0].groupRow.value).toEqual('NetAdvantage');
        expect(groupRows[1].groupRow.value).toEqual('Ignite UI for JavaScript');
    }));

    it('should have groups with correct summaries with paging.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.instance.paging = true;
        tick();
        fix.componentInstance.instance.perPage = 3;
        tick();
        fix.detectChanges();
        fix.componentInstance.instance.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(3);
        expect(groupRows[0].groupRow.records.length).toEqual(2);
        expect(groupRows[1].groupRow.records.length).toEqual(2);
        expect(groupRows[0].groupRow.value).toEqual('NetAdvantage');
        expect(groupRows[1].groupRow.value).toEqual('Ignite UI for JavaScript');

        fix.componentInstance.instance.paginate(1);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(3);
        expect(groupRows[0].groupRow.records.length).toEqual(2);
        expect(groupRows[1].groupRow.records.length).toEqual(2);
        expect(groupRows[0].groupRow.value).toEqual('Ignite UI for JavaScript');
        expect(groupRows[1].groupRow.value).toEqual('Ignite UI for Angular');
    }));

    it('should persist groupby state between pages.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.instance.paging = true;
        fix.componentInstance.instance.perPage = 3;
        tick();
        fix.componentInstance.instance.groupingExpansionState.push({
            expanded: false,
            hierarchy: [{ fieldName: 'ProductName', value: 'Ignite UI for JavaScript' }]
        });
        tick();
        fix.detectChanges();
        fix.componentInstance.instance.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();

        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(2);
        expect(groupRows[0].groupRow.records.length).toEqual(2);
        expect(groupRows[1].groupRow.records.length).toEqual(2);
        expect(dataRows[1].rowData.ProductName).toEqual('NetAdvantage');

        fix.componentInstance.instance.paginate(1);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(2);
        expect(groupRows[0].groupRow.records.length).toEqual(2);
        expect(groupRows[1].groupRow.records.length).toEqual(2);
        expect(dataRows[0].rowData.ProductName).toEqual('Ignite UI for Angular');

        fix.componentInstance.instance.paginate(0);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(2);
        expect(dataRows.length).toEqual(2);
        expect(groupRows[0].groupRow.records.length).toEqual(2);
        expect(groupRows[1].groupRow.records.length).toEqual(2);
        expect(dataRows[1].rowData.ProductName).toEqual('NetAdvantage');
    }));

    // GroupBy Area
    it('should apply group area if a column is grouped.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        tick();
        fix.detectChanges();
        const gridElement: HTMLElement = fix.nativeElement.querySelector('.igx-grid');

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        });
        fix.detectChanges();
        // verify group area is rendered
        expect(gridElement.querySelectorAll('.igx-grid__grouparea').length).toEqual(1);
    }));

    it('should apply group area if a column is groupable.', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        tick();
        fix.detectChanges();
        const gridElement: HTMLElement = fix.nativeElement.querySelector('.igx-grid');
        // verify group area is rendered
        expect(gridElement.querySelectorAll('.igx-grid__grouparea').length).toEqual(1);
        expect(gridElement.clientHeight).toEqual(700);
    }));

    it('should allow collapsing and expanding all group rows', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        const gridElement: HTMLElement = fix.nativeElement.querySelector('.igx-grid');

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        });
        grid.toggleAllGroupRows();
        tick();
        fix.detectChanges();
        const groupRows = grid.groupsRowList.toArray();
        expect(groupRows[0].expanded).not.toBe(true);
        expect(groupRows[groupRows.length - 1].expanded).not.toBe(true);

        grid.toggleAllGroupRows();
        tick();
        fix.detectChanges();
        expect(groupRows[0].expanded).toBe(true);
        expect(groupRows[groupRows.length - 1].expanded).toBe(true);
    }));

    // GroupBy chip
    it('should apply the chip correctly when there are grouping expressions applied and reordered', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        // set groupingExpressions
        const grid = fix.componentInstance.instance;
        const exprs: ISortingExpression[] = [
            { fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: true },
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: true }
        ];
        grid.groupingExpressions = exprs;
        tick();
        fix.detectChanges();
        let groupRows = grid.groupsRowList.toArray();
        checkGroups(groupRows,
            ['NetAdvantage', true, false, 'Ignite UI for JavaScript', true,
                false, 'Ignite UI for Angular', false, null, '', true, null, true],
            grid.groupingExpressions);
        let chips = fix.nativeElement.querySelectorAll('igx-chip');
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);

        // change order
        grid.groupingExpressions = [
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: true },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: true }
        ];
        tick();
        grid.sortingExpressions = [
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: true },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: true }
        ];
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        // verify groups
        checkGroups(groupRows,
            [null, 'Ignite UI for Angular', false, 'Ignite UI for Angular', 'Ignite UI for JavaScript',
                'NetAdvantage', true, null, '', 'Ignite UI for JavaScript', 'NetAdvantage'],
            grid.groupingExpressions);
        chips = fix.nativeElement.querySelectorAll('igx-chip');
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);
    }));

    it('should apply the chip correctly when there is grouping at runtime', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        const groupRows = grid.groupsRowList.toArray();
        const chips = fix.nativeElement.querySelectorAll('igx-chip');
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);
        checkGroups(groupRows, ['NetAdvantage', 'Ignite UI for JavaScript', 'Ignite UI for Angular', '', null]);
    }));

    it('should remove sorting when grouping is removed', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();
        let chips = fix.nativeElement.querySelectorAll('igx-chip');
        // click close button
        UIInteractions.simulateMouseEvent('click', chips[0].querySelector(CHIP_REMOVE_ICON), 0, 0);
        tick();
        fix.detectChanges();
        chips = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chips.length).toBe(0);
        expect(grid.groupingExpressions.length).toBe(0);
        expect(grid.sortingExpressions.length).toBe(0);
    }));

    it('should change sorting direction when grouping changes direction', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();
        let chips = fix.nativeElement.querySelectorAll('igx-chip');
        // click grouping direction arrow
        const event: IChipClickEventArgs = { owner: chips[0], originalEvent: null, cancel: false };
        grid.onChipClicked(event);
        tick();
        chips = fix.nativeElement.querySelectorAll('igx-chip');
        tick();
        expect(chips.length).toBe(1);
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);
        expect(chips[0].querySelector('igx-icon').innerText.trim()).toBe('arrow_upward');
    }));

    it('should change grouping direction when sorting changes direction', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        tick();
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        });
        fix.detectChanges();
        UIInteractions.simulateMouseEvent('click', fix.nativeElement.querySelector('igx-grid-header[id$="_ProductName"]'), 0, 0);
        tick();
        fix.detectChanges();
        const chips = fix.nativeElement.querySelectorAll('igx-chip');
        tick();
        checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);
    }));

    it('should allow row selection after grouping, scrolling down to a new virtual frame and attempting to select a row.', (done) => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.rowSelectable = true;
        fix.componentInstance.height = '200px';
        fix.detectChanges();

        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        grid.groupBy({
            fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false
        });

        fix.detectChanges();

        // scroll to bottom
        grid.verticalScrollContainer.getVerticalScroll().scrollTop = 10000;
        fix.detectChanges();
        setTimeout(() => {
            const rows = grid.dataRowList.toArray();
            expect(rows.length).toEqual(1);
            const checkBoxElement = rows[0].element.nativeElement.querySelector('.igx-checkbox__input');
            checkBoxElement.dispatchEvent(new Event('click'));
            setTimeout(() => {
                grid.cdr.detectChanges();
                expect(grid.selectedRows().length).toEqual(1);
                expect(rows[0].element.nativeElement.className).toEqual('igx-grid__tr igx-grid__tr--odd igx-grid__tr--selected');
                done();
            }, 100);
        }, 100);
    });

    it('should persist state for the correct group record when there are group records with the same fieldName and value.',
        fakeAsync(() => {
            const fix = TestBed.createComponent(GroupableGridComponent);
            const grid = fix.componentInstance.instance;
            fix.componentInstance.data = [
                {
                    Downloads: 0,
                    ID: 1,
                    ProductName: 'JavaScript',
                    ReleaseDate: new Date(),
                    Released: false
                },
                {
                    Downloads: 0,
                    ID: 2,
                    ProductName: 'JavaScript',
                    ReleaseDate: new Date(),
                    Released: true
                }
            ];
            tick();
            fix.detectChanges();

            grid.groupBy({
                fieldName: 'Released',
                dir: SortingDirection.Asc,
            });
            grid.groupBy({
                fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
            });

            fix.detectChanges();

            const groupRows = grid.groupsRowList.toArray();

            // group rows that have the same fieldName and value but belong to different parent groups
            const similarGroupRows = groupRows.filter((gRows) =>
                gRows.groupRow.value === 'JavaScript' && gRows.groupRow.expression.fieldName);
            expect(similarGroupRows.length).toEqual(2);

            // verify that if one is collapse the other remains expanded
            similarGroupRows[0].toggle();
            tick();

            expect(similarGroupRows[0].expanded).toEqual(false);
            expect(similarGroupRows[1].expanded).toEqual(true);
        }));

    it('should render disabled non-interactable chip for column that does not allow grouping.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.getColumnByName('ProductName').groupable = false;
        tick();
        grid.getColumnByName('Released').groupable = true;
        tick();
        fix.detectChanges();
        grid.groupBy([
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: true },
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: true }
        ]);
        fix.detectChanges();

        const chips = fix.nativeElement.querySelectorAll(CHIP);
        tick();
        expect(chips.length).toBe(2);

        // check correct chip is disabled
        expect(chips[0].className).toContain(DISABLED_CHIP);
        expect(chips[1].className).not.toContain(DISABLED_CHIP);

        // check no remove button on disabled chip
        expect(chips[0].querySelectorAll(CHIP_REMOVE_ICON).length).toEqual(0);
        expect(chips[1].querySelectorAll(CHIP_REMOVE_ICON).length).toEqual(1);

        // check click does not allow changing sort dir
        chips[0].children[0].dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1 }));
        tick();
        chips[0].children[0].dispatchEvent(new PointerEvent('pointerup'));
        tick();
        fix.detectChanges();

        chips[1].children[0].dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1 }));
        tick();
        chips[1].children[0].dispatchEvent(new PointerEvent('pointerup'));
        tick();

        fix.detectChanges();
        grid.cdr.detectChanges();

        const fChipDirection = chips[0].querySelector('[igxsuffix]').innerText;
        const sChipDirection = chips[1].querySelector('[igxsuffix]').innerText;

        expect(fChipDirection).toEqual('arrow_upward');
        expect(sChipDirection).toEqual('arrow_downward');
    }));

    it('should remove expansion state when removing groups', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.data = [
            {
                Downloads: 0,
                ID: 1,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: false
            },
            {
                Downloads: 0,
                ID: 2,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: true
            }
        ];
        tick();
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        fix.detectChanges();

        const groupRows = grid.groupsRowList.toArray();
        groupRows[1].toggle();
        tick();
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(false);

        grid.clearGrouping('ProductName');
        tick();
        fix.detectChanges();

        grid.groupBy([{
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        }]);
        fix.detectChanges();

        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(true);
        expect(groupRows[2].expanded).toEqual(true);
        expect(groupRows[3].expanded).toEqual(true);

        groupRows[1].toggle();
        tick();
        fix.detectChanges();

        grid.clearGrouping();
        tick();
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        fix.detectChanges();

        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(true);
        expect(groupRows[2].expanded).toEqual(true);
        expect(groupRows[3].expanded).toEqual(true);
    }));

    it('should remove expansion state of groups with higher group hierarchy', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.data = [
            {
                Downloads: 0,
                ID: 1,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: false
            },
            {
                Downloads: 0,
                ID: 2,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: true
            }
        ];
        tick();
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        groupRows[1].toggle();
        tick();
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(false);

        grid.clearGrouping('Released');
        tick();
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        fix.detectChanges();

        // reorder chips by simulating events
        const chips = fix.nativeElement.querySelectorAll('igx-chip');
        UIInteractions.simulatePointerEvent('pointerdown', chips[0], 0, 0);
        tick();
        UIInteractions.simulatePointerEvent('pointermove', chips[0], 200, 0);
        tick();
        UIInteractions.simulatePointerEvent('pointerup', chips[0], 0, 0);
        tick();
        fix.detectChanges();

        groupRows = grid.groupsRowList.toArray();
        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(true);
    }));

    it('should reorder groups when reordering chip', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });

        const chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        // Disable chip animations
        chipComponents.forEach((chip) => {
            chip.componentInstance.dragDir.animateOnRelease = false;
        });

        // Trigger initial pointer events on the element with igxDrag. When the drag begins the dragGhost should receive events.
        UIInteractions.simulatePointerEvent('pointerdown', chipComponents[0].componentInstance.dragDir.element.nativeElement, 75, 30);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir.element.nativeElement, 110, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointerup', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();
        const chipsElems = fix.nativeElement.querySelectorAll('igx-chip');
        checkChips(chipsElems, grid.groupingExpressions, grid.sortingExpressions);

        // verify groups
        const groupRows = grid.groupsRowList.toArray();
        checkGroups(groupRows,
            ['NetAdvantage', true, false, 'Ignite UI for JavaScript', true,
                false, 'Ignite UI for Angular', false, null, '', true, null, true],
            grid.groupingExpressions);

    });

    it('should remove expansion state when reordering chips', async () => {
        const fix = TestBed.createComponent(GroupableGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.data = [
            {
                Downloads: 0,
                ID: 1,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: false
            },
            {
                Downloads: 0,
                ID: 2,
                ProductName: 'JavaScript',
                ReleaseDate: new Date(),
                Released: true
            }
        ];
        fix.detectChanges();

        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
        ]);
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        groupRows[1].toggle();
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(false);

        groupRows = grid.groupsRowList.toArray();
        // reorder chips by simulating events
        let chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        // Disable chip animations
        chipComponents.forEach((chip) => {
            chip.componentInstance.dragDir.animateOnRelease = false;
        });
        fix.detectChanges();

        // Trigger initial pointer events on the element with igxDrag. When the drag begins the dragGhost should receive events.
        UIInteractions.simulatePointerEvent('pointerdown', chipComponents[0].componentInstance.dragDir.element.nativeElement, 100, 30);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir.element.nativeElement, 110, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointerup', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();

        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(true);

        let chipsElems = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chipsElems[0].querySelector('div.igx-chip__content').textContent.trim()).toEqual('ProductName');
        expect(chipsElems[1].querySelector('div.igx-chip__content').textContent.trim()).toEqual('Released');

        // reorder chips again to revert them in original state
        chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));

        // Trigger initial pointer events on the element with igxDrag. When the drag begins the dragGhost should receive events.
        UIInteractions.simulatePointerEvent('pointerdown', chipComponents[0].componentInstance.dragDir.element.nativeElement, 100, 30);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir.element.nativeElement, 110, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointermove', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();

        UIInteractions.simulatePointerEvent('pointerup', chipComponents[0].componentInstance.dragDir['_dragGhost'], 250, 30);
        await wait();
        fix.detectChanges();

        chipsElems = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chipsElems[0].querySelector('div.igx-chip__content').textContent.trim()).toEqual('Released');
        expect(chipsElems[1].querySelector('div.igx-chip__content').textContent.trim()).toEqual('ProductName');

        groupRows = grid.groupsRowList.toArray();
        expect(groupRows[0].expanded).toEqual(true);
        expect(groupRows[1].expanded).toEqual(true);
    });

    it('should not throw an error when moving a column over a chip when there is grouped columns', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();

        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: false
        });
        fix.detectChanges();

        const firstColumn = fix.debugElement.query(By.directive(IgxColumnMovingDragDirective));
        const directiveInstance = firstColumn.injector.get(IgxColumnMovingDragDirective);

        // Trigger initial pointer events on the element with igxDrag. When the drag begins the dragGhost should receive events.
        UIInteractions.simulatePointerEvent('pointerdown', firstColumn.nativeElement, 75, 30);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', firstColumn.nativeElement, 110, 30);
        await wait();

        expect(async () => {
            fix.detectChanges();
            UIInteractions.simulatePointerEvent('pointermove', directiveInstance['_dragGhost'], 250, 30);
            await wait();
        }).not.toThrow();

        fix.detectChanges();
        UIInteractions.simulatePointerEvent('pointerup', directiveInstance['_dragGhost'], 250, 30);
        await wait();
    });

    it('should throw an error when grouping more than 10 colunms', fakeAsync(() => {
        const fix = TestBed.createComponent(GroupByDataMoreColumnsComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.testData = [
            { 'A': '1', 'B': 'ALFKI', 'C': '2', 'D': '3', 'E': '4', 'F': '5', 'H': '6', 'G': '7', 'K': '8', 'L': '9', 'M': '10', 'N': '1' }
        ];
        tick();
        fix.detectChanges();
        let m = '';
        const expr = fix.componentInstance.columns.map(val => {
            return { fieldName: val.field, dir: SortingDirection.Asc, ignoreCase: true };
        });
        // not allowed to group by more than 10 columns
        try {
            grid.groupBy(expr);
            tick();
        } catch (e) {
            m = e.message;
        }
        tick();
        expect(m).toBe('Maximum amount of grouped columns is 10.');
    }));

    it('should display column header text in the grouping chip.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.columnList.toArray()[0].header = 'Custom Header Text';
        tick();
        fix.detectChanges();

        grid.groupBy({ fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false });
        fix.detectChanges();

        const chips = fix.nativeElement.querySelectorAll(CHIP);
        expect(chips.length).toBe(1);
        const chipText = chips[0].querySelector('div.igx-chip__content').innerText;
        expect(chipText).toEqual('Custom Header Text');
        expect(chips[0].getAttribute('title')).toEqual('Custom Header Text');
    }));

    it('should update grid sizes when columns are grouped/ungrouped.', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.componentInstance.width = '400px';
        tick();
        fix.componentInstance.height = '500px';
        tick();
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        const groupArea = fix.debugElement.query(By.css('.igx-grid__grouparea'));
        const gridHeader = fix.debugElement.query(By.css('.igx-grid__thead'));
        const gridFooter = fix.debugElement.query(By.css('.igx-grid__tfoot'));
        const gridScroll = fix.debugElement.query(By.css('.igx-grid__scroll'));

        let expectedHeight = parseInt(window.getComputedStyle(grid.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(groupArea.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridHeader.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridFooter.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridScroll.nativeElement).height, 10);

        expect(grid.calcHeight).toEqual(expectedHeight);

        // verify height is recalculated.
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false });
        grid.groupBy({ fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false });
        grid.groupBy({
            fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false
        });
        grid.groupBy({
            fieldName: 'ReleaseDate', dir: SortingDirection.Asc, ignoreCase: false
        });
        fix.detectChanges();

        expectedHeight = parseInt(window.getComputedStyle(grid.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(groupArea.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridHeader.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridFooter.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridScroll.nativeElement).height, 10);

        expect(grid.calcHeight).toEqual(expectedHeight);
        // veirify width is recalculated
        const indentation = fix.debugElement.query(By.css('.igx-grid__header-indentation'));

        expect(grid.pinnedWidth).toEqual(parseInt(window.getComputedStyle(indentation.nativeElement).width, 10));
        expect(grid.unpinnedWidth).toEqual(400 - parseInt(window.getComputedStyle(indentation.nativeElement).width, 10));

        grid.clearGrouping();
        tick();
        fix.detectChanges();

        expectedHeight = parseInt(window.getComputedStyle(grid.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(groupArea.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridHeader.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridFooter.nativeElement).height, 10)
            - parseInt(window.getComputedStyle(gridScroll.nativeElement).height, 10);

        expect(grid.calcHeight).toEqual(expectedHeight);
        expect(grid.pinnedWidth).toEqual(0);
        expect(grid.unpinnedWidth).toEqual(400);
    }));

    it('should expose tree structure to access groups', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.groupBy([
            { fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
        ]);

        // there should be 3 groups at top level
        const groupsRecords = grid.groupsRecords;
        expect(groupsRecords.length).toBe(3);
        expect(groupsRecords[0].value).toBeNull();
        expect(groupsRecords[0].expression.fieldName).toBe('Released');
        // the first group should have 1 sub group which has 1 subgroup too
        const fsubGroups = groupsRecords[0].groups;
        expect(fsubGroups.length).toBe(1);
        expect(fsubGroups[0].value).toBe(1000);
        expect(fsubGroups[0].expression.fieldName).toBe('Downloads');
        const fsubsubGroups = groupsRecords[0].groups[0].groups;
        expect(fsubsubGroups.length).toBe(1);
        expect(fsubsubGroups[0].value).toBe('Ignite UI for Angular');
        expect(fsubsubGroups[0].expression.fieldName).toBe('ProductName');

        expect(groupsRecords[2].value).toBe(true);
        expect(groupsRecords[2].expression.fieldName).toBe('Released');
        // the last group should have 4 sub group which has 1 subgroup
        const lsubGroups = groupsRecords[2].groups;
        expect(lsubGroups.length).toBe(4);
        expect(lsubGroups[0].value).toBeNull();
        expect(lsubGroups[0].expression.fieldName).toBe('Downloads');
        const lsubsubGroups = groupsRecords[2].groups[0].groups;
        expect(lsubsubGroups.length).toBe(1);
        expect(lsubsubGroups[0].value).toBe('Ignite UI for JavaScript');
        expect(lsubsubGroups[0].expression.fieldName).toBe('ProductName');
    }));

    it('should allows expanding/collapsing groups extracted from the groupRows tree', fakeAsync(() => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        grid.primaryKey = 'ID';
        fix.detectChanges();
        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });
        fix.detectChanges();

        let groupRows = grid.groupsRowList.toArray();
        let dataRows = grid.dataRowList.toArray();
        // verify groups and data rows count
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        // toggle grouprow - collapse
        expect(groupRows[0].expanded).toEqual(true);
        grid.toggleGroup(grid.groupsRecords[0]);
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(false);
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(4);
        // verify collapsed group sub records are not rendered

        for (const rec of groupRows[0].groupRow.records) {
            expect(grid.getRowByKey(rec.ID)).toBeUndefined();
        }

        // toggle grouprow - expand
        grid.toggleGroup(grid.groupsRecords[0]);
        fix.detectChanges();
        expect(groupRows[0].expanded).toEqual(true);
        groupRows = grid.groupsRowList.toArray();
        dataRows = grid.dataRowList.toArray();
        expect(groupRows.length).toEqual(3);
        expect(dataRows.length).toEqual(8);

        // verify expanded group sub records are rendered
        for (const rec of groupRows[0].groupRow.records) {
            expect(grid.getRowByKey(rec.ID)).not.toBeUndefined();
        }
    }));

    it('should allow setting groupingExpressions and sortingExpressions initially.',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            fix.componentInstance.enableSorting = true;
            const grid = fix.componentInstance.instance;
            grid.sortingExpressions =
                [{ fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false }];
            grid.groupingExpressions =
                [{ fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false }];
            fix.detectChanges();

            expect(grid.sortingExpressions.length).toEqual(2);
            expect(grid.groupingExpressions.length).toEqual(1);

            const groupRows = grid.groupsRowList.toArray();

            expect(groupRows.length).toEqual(3);

            const chips = fix.nativeElement.querySelectorAll('igx-chip');
            checkChips(chips, grid.groupingExpressions, grid.sortingExpressions);

            const sortingIcon = fix.debugElement.query(By.css('.sort-icon'));
            expect(sortingIcon.nativeElement.textContent.trim()).toEqual(SORTING_ICON_ASC_CONTENT);
        }));

    it('should show horizontal scrollbar if column widths are equal to the grid width and a column is grouped.',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);

            const grid = fix.componentInstance.instance;

            grid.columnWidth = '200px';
            tick();
            fix.componentInstance.width = '1000px';
            tick();

            fix.detectChanges();

            const hScrBar = grid.scr.nativeElement;
            expect(hScrBar.hidden).toBe(true);

            grid.groupBy({
                fieldName: 'Downloads',
                dir: SortingDirection.Asc,
                ignoreCase: false
            });
            fix.detectChanges();
            expect(hScrBar.hidden).toBe(false);
        }));

    it('should allow changing the text of the drop area', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        fix.componentInstance.instance.dropAreaMessage = 'Drop area here!';
        await wait();
        fix.detectChanges();

        const groupDropArea = fix.debugElement.query(By.directive(IgxGroupAreaDropDirective));
        expect(groupDropArea.nativeElement.children[1].textContent).toEqual('Drop area here!');
    });

    it('should allow templating the drop area by passing template reference', async () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        fix.componentInstance.instance.dropAreaTemplate = fix.componentInstance.dropAreaTemplate;
        await wait();
        fix.detectChanges();

        const groupDropArea = fix.debugElement.query(By.directive(IgxGroupAreaDropDirective));
        expect(groupDropArea.nativeElement.textContent.trim()).toEqual('Custom template');
    });

    it('should hide all the grouped columns when hideGroupedColumns option is initially set to "true"',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            grid.hideGroupedColumns = true;
            tick();
            fix.detectChanges();
            grid.groupBy([
                { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false },
                { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
            ]);
            tick();
            fix.detectChanges();
            // the two grouped columns should be hidden
            expect(grid.getColumnByName('Downloads').hidden).toBe(true);
            expect(grid.getColumnByName('ProductName').hidden).toBe(true);
            // these should be visible
            expect(grid.getColumnByName('ID').hidden).toBe(false);
            expect(grid.getColumnByName('ReleaseDate').hidden).toBe(false);
            expect(grid.getColumnByName('Released').hidden).toBe(false);
        }));

    it('should show all the grid columns when hideGroupedColumns option is set to "false" at runtime, after being "true" initially',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            grid.hideGroupedColumns = true;
            fix.detectChanges();
            grid.groupBy([
                { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false },
                { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
            ]);
            tick();
            fix.detectChanges();
            // the two grouped columns should be hidden initially
            expect(grid.getColumnByName('Downloads').hidden).toBe(true);
            expect(grid.getColumnByName('ProductName').hidden).toBe(true);
            grid.hideGroupedColumns = false;
            tick();
            fix.detectChanges();
            // all columns, whether grouped or ungrouped, should be visible
            expect(grid.getColumnByName('Downloads').hidden).toBe(false);
            expect(grid.getColumnByName('ProductName').hidden).toBe(false);
            expect(grid.getColumnByName('ID').hidden).toBe(false);
            expect(grid.getColumnByName('ReleaseDate').hidden).toBe(false);
            expect(grid.getColumnByName('Released').hidden).toBe(false);
        }));

    it('should hide the grouped columns when hideGroupedColumns option is set to "true" at runtime, after being "false" initially',
        fakeAsync(() => {
            const fix = TestBed.createComponent(DefaultGridComponent);
            const grid = fix.componentInstance.instance;
            fix.detectChanges();
            grid.groupBy([
                { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false },
                { fieldName: 'ProductName', dir: SortingDirection.Asc, ignoreCase: false }
            ]);
            tick();
            fix.detectChanges();
            // all columns, whether grouped or ungrouped, should be visible
            expect(grid.getColumnByName('Downloads').hidden).toBe(false);
            expect(grid.getColumnByName('ProductName').hidden).toBe(false);
            expect(grid.getColumnByName('ID').hidden).toBe(false);
            expect(grid.getColumnByName('ReleaseDate').hidden).toBe(false);
            expect(grid.getColumnByName('Released').hidden).toBe(false);
            grid.hideGroupedColumns = true;
            tick();
            fix.detectChanges();
            // the two grouped columns should now be hidden
            expect(grid.getColumnByName('Downloads').hidden).toBe(true);
            expect(grid.getColumnByName('ProductName').hidden).toBe(true);
        }));

    it('should update grouping expression when sorting a column first then grouping by it and changing sorting for it again', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        const strategy = CustomSortingStrategy.instance();
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();

        grid.sort({ fieldName: 'ID', dir: SortingDirection.Asc, ignoreCase: false, strategy: strategy });

        expect(grid.sortingExpressions).toEqual([{ fieldName: 'ID', dir: SortingDirection.Asc, ignoreCase: false, strategy: strategy }]);
        expect(grid.groupingExpressions).toEqual([]);

        grid.groupBy({ fieldName: 'ID', dir: SortingDirection.Asc, ignoreCase: false, strategy: strategy });
        grid.sort({ fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false, strategy: strategy });

        expect(grid.sortingExpressions).toEqual([{ fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false, strategy: strategy }]);
        expect(grid.groupingExpressions).toEqual([{ fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false, strategy: strategy }]);
    });

    it('should update grouping expression when sorting a column first then grouping by another and changing sorting for it', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        const grid = fix.componentInstance.instance;
        fix.componentInstance.enableSorting = true;
        fix.detectChanges();

        grid.sort({ fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false });
        grid.sort({ fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false });

        expect(grid.sortingExpressions).toEqual([
            { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false },
            { fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false }
        ]);
        expect(grid.groupingExpressions).toEqual([]);

        grid.groupBy({ fieldName: 'Released', dir: SortingDirection.Asc, ignoreCase: false });
        grid.sort({ fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false });

        expect(grid.sortingExpressions).toEqual([
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false },
            { fieldName: 'Downloads', dir: SortingDirection.Asc, ignoreCase: false, strategy: DefaultSortingStrategy.instance() },
            { fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false, strategy: DefaultSortingStrategy.instance() }
        ]);
        expect(grid.groupingExpressions).toEqual([{
            fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: false
        }]);
    });

    it('should not be able to group by ColumnGroup', (async () => {
        const fix = TestBed.createComponent(MultiColumnHeadersWithGroupingComponent);
        const grid = fix.componentInstance.grid;
        fix.detectChanges();

        // Try to group by a column group
        const header = fix.debugElement.queryAll(By.css('.igx-grid__thead-title'))[0].nativeElement;
        UIInteractions.simulatePointerEvent('pointerdown', header, 10, 10);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', header, 150, 22);
        await wait(50);
        UIInteractions.simulatePointerEvent('pointermove', header, 100, 30);
        await wait(50);
        UIInteractions.simulatePointerEvent('pointerup', header, 100, 30);
        await wait(50);
        fix.detectChanges();

        // verify there is no grouping
        const groupRows = grid.groupsRowList.toArray();
        expect(groupRows.length).toBe(0);
        expect(grid.groupingExpressions).toEqual([]);
    }));

    it('should not show the group area if only columnGroups has property groupable set to true', (async () => {
        const fix = TestBed.createComponent(MultiColumnHeadersWithGroupingComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.grid;
        grid.getColumnByName('ID').groupable = false;
        await wait(30);
        fix.detectChanges();

        const gridElement: HTMLElement = fix.nativeElement.querySelector('.igx-grid');
        // verify group area is not rendered
        expect(gridElement.querySelectorAll('.igx-grid__grouparea').length).toEqual(0);
    }));

    it('should add title attribute to chips when column is grouped', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const exprs: ISortingExpression[] = [
            { fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: true },
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: true }
        ];
        const grid = fix.componentInstance.instance;
        grid.groupBy(exprs);
        fix.detectChanges();
        const chips = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chips[0].getAttribute('title')).toEqual('ProductName');
        expect(chips[1].getAttribute('title')).toEqual('Released');
    });

    it('should not be able to group by ColumnGroup', (async () => {
        const fix = TestBed.createComponent(MultiColumnHeadersWithGroupingComponent);
        const grid = fix.componentInstance.grid;
        fix.detectChanges();

        // Try to group by a column group
        const header = fix.debugElement.queryAll(By.css('.igx-grid__thead-title'))[0].nativeElement;
        UIInteractions.simulatePointerEvent('pointerdown', header, 10, 10);
        await wait();
        UIInteractions.simulatePointerEvent('pointermove', header, 150, 22);
        await wait(50);
        UIInteractions.simulatePointerEvent('pointermove', header, 100, 30);
        await wait(50);
        UIInteractions.simulatePointerEvent('pointerup', header, 100, 30);
        await wait(50);
        fix.detectChanges();

        // verify there is no grouping
        const groupRows = grid.groupsRowList.toArray();
        expect(groupRows.length).toBe(0);
        expect(grid.groupingExpressions).toEqual([]);
    }));

    it('should not show the group area if only columnGroups has property groupable set to true', (async () => {
        const fix = TestBed.createComponent(MultiColumnHeadersWithGroupingComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.grid;
        grid.getColumnByName('ID').groupable = false;
        await wait(30);
        fix.detectChanges();

        const gridElement: HTMLElement = fix.nativeElement.querySelector('.igx-grid');
        // verify group area is not rendered
        expect(gridElement.querySelectorAll('.igx-grid__grouparea').length).toEqual(0);
    }));

    it('should add title attribute to chips when column is grouped', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        const exprs: ISortingExpression[] = [
            { fieldName: 'ProductName', dir: SortingDirection.Desc, ignoreCase: true },
            { fieldName: 'Released', dir: SortingDirection.Desc, ignoreCase: true }
        ];
        const grid = fix.componentInstance.instance;
        grid.groupBy(exprs);
        fix.detectChanges();

        const chips = fix.nativeElement.querySelectorAll('igx-chip');
        expect(chips[0].getAttribute('title')).toEqual('ProductName');
        expect(chips[1].getAttribute('title')).toEqual('Released');
    });

    function sendInput(element, text, fix) {
        element.nativeElement.value = text;
        element.nativeElement.dispatchEvent(new Event('input'));
        fix.detectChanges();
        return fix.whenStable();
    }
});
@Component({
    template: `
        <igx-grid
            [width]='width'
            [height]='height'
            [data]="data"
            [autoGenerate]="true" (onColumnInit)="columnsCreated($event)" (onGroupingDone)="onGroupingDoneHandler($event)">
        </igx-grid>
        <ng-template #dropArea>
            <span> Custom template </span>
        </ng-template>
    `
})
export class DefaultGridComponent extends DataParent {
    public width = '800px';
    public height = null;

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    @ViewChild('dropArea', { read: TemplateRef })
    public dropAreaTemplate: TemplateRef<any>;

    public enableSorting = false;
    public enableFiltering = false;
    public enableResizing = false;
    public enableEditing = false;
    public enableGrouping = true;
    public currentSortExpressions;

    public columnsCreated(column: IgxColumnComponent) {
        column.sortable = this.enableSorting;
        column.filterable = this.enableFiltering;
        column.resizable = this.enableResizing;
        column.editable = this.enableEditing;
        column.groupable = this.enableGrouping;
    }
    public onGroupingDoneHandler(sortExpr) {
        this.currentSortExpressions = sortExpr;
    }
}

@Component({
    template: `
        <igx-grid
            [width]='width'
            [height]='height'
            [data]="data"
            [paging]="true">
            <igx-column [field]="'ID'" [header]="'ID'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'ReleaseDate'" [header]="'ReleaseDate'" [width]="200" [groupable]="true" [hasSummary]="false"
                dataType="date"></igx-column>
            <igx-column [field]="'Downloads'" [header]="'Downloads'" [width]="200" [groupable]="true" [hasSummary]="false"
                dataType="number"></igx-column>
            <igx-column [field]="'ProductName'" [header]="'ProductName'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'Released'" [header]="'Released'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
        </igx-grid>
    `
})
export class GroupableGridComponent extends DataParent {
    public width = '800px';
    public height = '700px';

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;
}

@Component({
    template: `
        <igx-grid
            [width]='width'
            [height]='height'
            [data]="data">
            <igx-column [field]="'ID'" [header]="'ID'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'ReleaseDate'" [header]="'ReleaseDate'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'Downloads'" [header]="'Downloads'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'ProductName'" [header]="'ProductName'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <igx-column [field]="'Released'" [header]="'Released'" [width]="200" [groupable]="true" [hasSummary]="false"></igx-column>
            <ng-template igxGroupByRow let-groupRow>
                <span>Total items with value:{{ groupRow.value }} are {{ groupRow.records.length }}</span>
            </ng-template>
        </igx-grid>
    `
})
export class CustomTemplateGridComponent extends DataParent {
    public width = '800px';
    public height = null;

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;
}

@Component({
    template: `
        <igx-grid
            [width]='width'
            [height]='height'
            [data]="testData">
                <igx-column *ngFor="let c of columns" [field]="c.field" [header]="c.field" [width]="c.width">
                </igx-column>
        </igx-grid>
    `
})
export class GroupByDataMoreColumnsComponent extends DataParent {
    public width = '800px';
    public height = null;
    public testData = [];

    public columns = [
        { field: 'A', width: 100 },
        { field: 'B', width: 100 },
        { field: 'C', width: 100 },
        { field: 'D', width: 100 },
        { field: 'E', width: 100 },
        { field: 'F', width: 100 },
        { field: 'H', width: 100 },
        { field: 'G', width: 100 },
        { field: 'K', width: 100 },
        { field: 'L', width: 100 },
        { field: 'M', width: 100 },
        { field: 'N', width: 100 }
    ];

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;
}

export class CustomSortingStrategy extends DefaultSortingStrategy {
}
