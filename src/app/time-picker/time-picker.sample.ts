import { Component, ViewChild } from '@angular/core';
import { InteractionMode, IgxTimePickerComponent } from 'igniteui-angular';

@Component({
    selector: 'app-time-picker-sample',
    styleUrls: [ 'time-picker.sample.css' ],
    templateUrl: 'time-picker.sample.html'
})
export class TimePickerSampleComponent {
    max = "19:00";
    min = "09:00";

    itemsDelta = { hours: 1, minutes: 5 };
    format="hh:mm tt";
    isSpinLoop = true;
    mode = InteractionMode.dropdown;

    date = new Date(2018, 10, 27, 17, 45, 0, 0);

    @ViewChild('tp', { read: IgxTimePickerComponent })
    public tp: IgxTimePickerComponent;
}
