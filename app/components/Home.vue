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
import { Application, iOSApplication } from '@nativescript/core';
export default {
    computed: {
        message() {
            return "Blank {N}-Vue";
        }
    },
    methods: {
        vibrate: async function() {
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

                
            } else if (Application.ios) {
                AudioServicesPlaySystemSoundWithCompletion(1352,null); //vibe
                // AudioServicesPlaySystemSoundWithCompletion(1020,null); //sound
                // var mainBundle = NSBundle.mainBundle

                if(!this.hasPermission()) {
                    await this.getPermission();
                    this.hasPermission() ? '' : alert("권한 설정을 거부하셨습니다. 기능 사용을 원하실 경우, 기기의 '설정' 앱으로 이동하여 callApp의 권한을 허용 해주세요.");
                }
                
                // UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler
                let content = UNMutableNotificationContent.new();
                content.title = "title";
                content.body = "body";
                content.sound = UNNotificationSound.defaultSound;

                const userInfoDict = NSMutableDictionary.alloc().initWithCapacity(4);
                userInfoDict.setObjectForKey(1, 'id');
			    userInfoDict.setObjectForKey('title_first', 'title');
			    userInfoDict.setObjectForKey('body_first', 'body');
                userInfoDict.setObjectForKey('10', 'interval');
                content.userInfo = userInfoDict;

                let trigger = UNTimeIntervalNotificationTrigger.triggerWithTimeIntervalRepeats(5, false);
                let request = UNNotificationRequest.requestWithIdentifierContentTrigger("test_notification", content, trigger);

                UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(request, (error) => (error ? console.log(`Error scheduling notification: ${error.localizedDescription}`) : null));
                iOSApplication.addNotificationObserver('test_notification', alert("1234"))
            }
        },
        hasPermission: function() { // in iOS
            if(Application.android) return ;
            const settings = UIApplication.sharedApplication.currentUserNotificationSettings;
            const types = UIUserNotificationType.Alert | UIUserNotificationType.Badge | UIUserNotificationType.Sound;
            return (settings.types & types) > 0;
        },
        getPermission: function() { // in iOS
            if(Application.android) return ;
            return new Promise((resolve, reject) => {
                UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler(UNAuthorizationOptions.Alert | UNAuthorizationOptions.Badge | UNAuthorizationOptions.Sound, (granted, error) => resolve(granted));
            });
        },
        isUNUserNotificationCenterAvailable: function() {
            // iOS 10 이상 사용 가능 
            return !!UNUserNotificationCenter;
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
