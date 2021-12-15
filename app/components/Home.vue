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
                vibrateService.vibrate(2000);
            } else if (Application.ios) {
                
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
