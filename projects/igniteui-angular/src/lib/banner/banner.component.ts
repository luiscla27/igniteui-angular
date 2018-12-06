import { Component, NgModule, EventEmitter, Output, Input, ViewChild, ElementRef,
    ContentChild, HostBinding } from '@angular/core';
import { IgxExpansionPanelModule } from '../expansion-panel/expansion-panel.module';
import { AnimationSettings } from '../expansion-panel/expansion-panel.component';
import { IgxExpansionPanelComponent } from '../expansion-panel';
import { IgxIconModule, IgxIconComponent } from '../icon/index';
import { IToggleView } from '../core/navigation';
import { IgxButtonModule } from '../directives/button/button.directive';
import { IgxRippleModule } from '../directives/ripple/ripple.directive';
import { IgxBannerActionsDirective } from './banner.directives';
import { CommonModule } from '@angular/common';
import { CancelableEventArgs } from '../core/utils';

export interface BannerEventArgs {
    banner: IgxBannerComponent;
    event?: Event;
}

export interface BannerCancelEventArgs extends BannerEventArgs, CancelableEventArgs {
}
/**
 * **Ignite UI for Angular Banner** -
 * [Documentation](https://www.infragistics.com/products/ignite-ui-angular/angular/components/banner.html)
 *
 * The Ignite UI Banner provides a highly templateable and easy to use banner that can be shown in your application.
 *
 * Usage:
 *
 * ```html
 * <igx-banner #banner>
 *   Our privacy settings have changed.
 *  <igx-banner-actions>
 *      <button igxButton="raised">Read More</button>
 *      <button igxButton="raised">Accept and Continue</button>
 *  </igx-banner-actions>
 * </igx-banner>
 * ```
 */
@Component({
    selector: 'igx-banner',
    templateUrl: 'banner.component.html'
})
export class IgxBannerComponent implements IToggleView {
    private _bannerEvent: BannerEventArgs;
    private _animationSettings: AnimationSettings;

    @ViewChild('expansionPanel')
    private _expansionPanel: IgxExpansionPanelComponent;

    @ContentChild(IgxBannerActionsDirective)
    private _bannerActionTemplate: any;

    /**
     * @hidden
     */
    @ContentChild(IgxIconComponent)
    public bannerIcon: any;

    /**
     * Fires after the banner shows up
     * ```typescript
     * public handleOpened(event) {
     *  ...
     * }
     * ```
     * ```html
     * <igx-banner (onOpened)="handleOpened($event)"></igx-banner>
     * ```
     */
    @Output()
    public onOpened = new EventEmitter<BannerEventArgs>();

    /**
     * Fires before the banner shows up
     * ```typescript
     * public handleOpening(event) {
     *  ...
     * }
     * ```
     * ```html
     * <igx-banner (onOpening)="handleOpening($event)"></igx-banner>
     * ```
     */
    @Output()
    public onOpening = new EventEmitter<BannerCancelEventArgs>();

    /**
     * Fires after the banner hides
     * ```typescript
     * public handleClosed(event) {
     *  ...
     * }
     * ```
     * ```html
     * <igx-banner (onClosed)="handleClosed($event)"></igx-banner>
     * ```
     */
    @Output()
    public onClosed = new EventEmitter<BannerEventArgs>();

    /**
     * Fires before the banner hides
     * ```typescript
     * public handleClosing(event) {
     *  ...
     * }
     * ```
     * ```html
     * <igx-banner (onClosing)="handleClosing($event)"></igx-banner>
     * ```
     */
    @Output()
    public onClosing = new EventEmitter<BannerCancelEventArgs>();

    /** @hidden */
    public get useDefaultTemplate(): boolean {
        return !this._bannerActionTemplate;
    }

    /**
     * Get the animation settings used by the banner open/close methods
     * ```typescript
     * let currentAnimations: AnimationSettings = banner.animationSettings
     * ```
     */
    @Input()
    public get animationSettings(): AnimationSettings {
        return this._animationSettings ? this._animationSettings : this._expansionPanel.animationSettings;
    }

    /**
     * Set the animation settings used by the banner open/close methods
     * ```typescript
     * import { slideInLeft, slideOutRight } from 'igniteui-angular';
     * ...
     * banner.animationSettings: AnimationSettings = { openAnimation: slideInLeft, closeAnimation: slideOutRight };
     * ```
     */
    public set animationSettings(settings: AnimationSettings) {
        this._animationSettings = settings;
    }
    /**
     * Gets whether banner is collapsed
     *
     * ```typescript
     * const isCollapsed: boolean = banner.collapsed;
     * ```
     */
    public get collapsed() {
        return this._expansionPanel.collapsed;
    }

    /**
     * Returns the native element of the banner component
     * ```typescript
     *  const myBannerElement: HTMLElement = banner.element;
     * ```
     */
    public get element() {
        return this.elementRef.nativeElement;
    }

    /**
     * @hidden
     */
    @HostBinding('style.display')
    public get displayStyle(): string {
        return this.collapsed ? '' : 'block';
    }

    constructor(public elementRef: ElementRef) { }

    /**
     * Opens the banner
     *
     * ```typescript
     *  myBanner.open();
     * ```
     *
     * ```html
     * <igx-banner #banner>
     * ...
     * </igx-banner>
     * <button (click)="banner.open()">Open Banner</button>
     * ```
     */
    public open(event?: Event) {
        this._bannerEvent = { banner: this, event};
        const openingArgs = {
            banner: this,
            event,
            cancel: false
        };
        this.onOpening.emit(openingArgs);
        if (openingArgs.cancel) {
            return;
        }
        this._expansionPanel.open(event);
    }

    /**
     * Closes the banner
     *
     * ```typescript
     *  myBanner.close();
     * ```
     *
     * ```html
     * <igx-banner #banner>
     * ...
     * </igx-banner>
     * <button (click)="banner.close()">Close Banner</button>
     * ```
     */
    public close(event?: Event) {
        this._bannerEvent = { banner: this, event};
        const closingArgs = {
            banner: this,
            event,
            cancel: false
        };
        this.onClosing.emit(closingArgs);
        if (closingArgs.cancel) {
            return;
        }
        this._expansionPanel.close(event);
    }

    /**
     * Toggles the banner
     *
     * ```typescript
     *  myBanner.toggle();
     * ```
     *
     * ```html
     * <igx-banner #banner>
     * ...
     * </igx-banner>
     * <button (click)="banner.toggle()">Toggle Banner</button>
     * ```
     */
    toggle(event?: Event) {
        if (this.collapsed) {
            this.open(event);
        } else {
            this.close(event);
        }
    }

    /** @hidden */
    public onExpansionPanelOpen() {
        this.onOpened.emit(this._bannerEvent);
    }

    /** @hidden */
    public onExpansionPanelClose() {
        this.onClosed.emit(this._bannerEvent);
    }
}
@NgModule({
    declarations: [IgxBannerComponent, IgxBannerActionsDirective],
    exports: [IgxBannerComponent, IgxBannerActionsDirective],
    imports: [CommonModule, IgxExpansionPanelModule, IgxIconModule, IgxButtonModule, IgxRippleModule]
})
export class IgxBannerModule { }
