<template>
    <Page>
        <ActionBar>
            <Label text="Home"/>
        </ActionBar>

        <GridLayout>
            <Label class="info" @tap="vibrate()">
                <FormattedString>
                    <Span class="fas" text.decode="&#xf135; "/>
                    <Span :text="message" />
                </FormattedString>
            </Label>
        </GridLayout>
    </Page>
</template>

<script>
import { Application, Color } from '@nativescript/core';
import { LocalNotifications } from '@nativescript/local-notifications';
export default {
    computed: {
        message() {
            return "Blank {N}-Vue";
        }
    },
    methods: {
        vibrate: function() {
            if (Application.android) {
                let vibrateService = Application.android.context.getSystemService(android.content.Context.VIBRATOR_SERVICE);
                vibrateService.vibrate(1000);


                // let soundService = Application.android.context.getSystemService(android.content.Context.AUDIO_SERVICE);
                let media = android.media;
                let RingtoneManager = media.RingtoneManager;
                let notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                let Ringtone = RingtoneManager.getRingtone(Application.android.context, notification);
                Ringtone.play();

                setInterval(function() {
                    Ringtone.stop();
                }.bind(Ringtone),3000);
                
                this.notification();
                
            } else if (Application.ios) {
                AudioServicesPlaySystemSoundWithCompletion(1352,null); //vibe
            }
        },
        notification: function() {
            LocalNotifications.schedule([
            {
                id: 1, // generated id if not set
                title: 'The title',
                body: 'Recurs every minute until cancelled',
                ticker: 'The ticker',
                color: new Color('red'),
                badge: 1,
                // groupedMessages: ['The first', 'Second', 'Keep going', 'one more..', 'OK Stop'], //android only
                // groupSummary: 'Summary of the grouped messages above', //android only
                // ongoing: true, // makes the notification ongoing (Android only)
                forceShowWhenInForeground: true,
                priority: 2,
                icon: 'res://heart',
                image: 'https://cdn-images-1.medium.com/max/1200/1*c3cQvYJrVezv_Az0CoDcbA.jpeg',
                thumbnail: true,
                interval: 'minute',
                channel: 'My Channel', // default: 'Channel'
                sound: this.isAndroid ? 'customsound' : 'customsound.wav',
                at: new Date(new Date().getTime() + 10 * 1000), // 10 seconds from now
                actions: [
                    {
                        id: "yes",
                        type: "button",
                        title: "Yes (and launch app)",
                        launch: true
                    },
                    {
                        id: "no",
                        type: "button",
                        title: "No",
                        launch: false
                    }
                ]
            },
            ]).then(
                (scheduledIds) => {
                    console.log('Notification id(s) scheduled: ' + JSON.stringify(scheduledIds));
                },
                (error) => {
                    console.log('scheduling error: ' + error);
                }
            );
        },
    },
    data() {
        return {
            isAndroid: Application.android,
        }
    },
};
</script>

<style scoped lang="scss">
    @import '@nativescript/theme/scss/variables/blue';

    // Custom styles
    .fas {
        @include colorize($color: accent);
    }

    .info {
        font-size: 20;
        horizontal-align: center;
        vertical-align: center;
    }
</style>
