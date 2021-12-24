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
import { SharedNotificationDelegate } from '@nativescript/shared-notification-delegate';
import { firebase } from '@nativescript/firebase';
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
                
                this.notification();
                
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
                let request = UNNotificationRequest.requestWithIdentifierContentTrigger("test_notification1111", content, trigger);
                
                UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(request, (error) => (error ? console.log(`Error scheduling notification: ${error.localizedDescription}`) : null));
                this.addObserver("test_notification");
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
        addObserver: function(uniqueKey) {
            SharedNotificationDelegate.addObserver({
                delegateUniqueKey: uniqueKey, // ensures uniqueness, if not set or is null/undefined, allows multiple of the same
                userNotificationCenterWillPresentNotificationWithCompletionHandler: (notificationCenter, notification, handler, stop, next) => {
                    // is this notification something I should handle?
                    if (notification.request.content.userInfo.valueForKey('id') === 1) {
                        // do stuff
                        // intercept it and show alert
                        handler(UNNotificationPresentationOptions.Alert);
                        SharedNotificationDelegate.removeObserverByUniqueKey(uniqueKey);
                        return;
                    }
                    // not mine, next should handle
                    next();
                }
            });
        },
        initFirebase: function() {
            firebase.init({
                // Optionally pass in properties for database, authentication and cloud messaging,
                // see their respective docs.
                showNotificationsWhenInForeground: true,
                onMessageReceivedCallback: function(message) {
                    console.log("Title: " + message.title);
                    console.log("Body: " + message.body);
                    // if your server passed a custom property called 'foo', then do this:
                    console.log("Value of 'foo': " + message.data.foo);
                },
                onPushTokenReceivedCallback: function(token) {
                    console.log("Firebase push token: " + token);
                },
            }).then(
                () => {
                    console.log("firebase.init done333");
                },
                error => {
                    console.log(`firebase.init error333: ${error}`);
                }
            );
        },
        initFirebase_ios: function() {
            firebase.init({
                // Optionally pass in properties for database, authentication and cloud messaging,
                // see their respective docs.
            }).then(
                () => {
                    console.log("firebase.init 12ddone");
                },
                error => {
                    console.log(`firebase.init 12doneerror: ${error}`);
                }
            );
        },
        requestUserPermission: async function() {
            const authStatus = await firebase()
                .messaging()
                .requestPermission({
                ios: {
                    alert: true
                }
                })
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL

            if (enabled) {
                console.log('Authorization status:', authStatus)
            }
        },
    },
    data() {
        return {
            isAndroid: Application.android,
        }
    },
    created() {
        this.initFirebase_ios();
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
