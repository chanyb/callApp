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
import { Application } from '@nativescript/core';
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

                var path = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

                // let soundService = Application.android.context.getSystemService(android.content.Context.AUDIO_SERVICE);
                let media = android.media;
                let RingtoneManager = media.RingtoneManager;
                let notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                let Rington = RingtoneManager.getRingtone(Application.android.context, notification);
                Rington.play();

                // for(var name in RingtoneManager) {
                //     console.log(name);
                // }
                
            } else if (Application.ios) {
                AudioServicesPlaySystemSoundWithCompletion(1352,null); //vibe
            }
        },
    }
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
