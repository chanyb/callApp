<template>
    <Page>
        <ActionBar>
            <Label text="Home"/>
        </ActionBar>

        <GridLayout>
            <Label class="info" @tap="isAndroid ? notification_android() : vibrate()">
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
        broadcastReceiver_example: function() {
            let alarmService = Application.android.context.getSystemService(android.content.Context.ALARM_SERVICE);
            let broadcastReceiver = android.content.BroadcastReceiver;
            // var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW)
            var intentFilter = new android.content.IntentFilter;
            intentFilter.addAction(android.content.Intent.ACTION_LOCALE_CHANGED);
            Application.android.registerBroadcastReceiver(intentFilter, function(context, intent) {
                console.log("언어 설정을 변경했습니다.");

                Application.android.unregisterBroadcastReceiver(intentFilter);
            });
        },
        sound_android: function() {
            let media = android.media;
            let RingtoneManager = media.RingtoneManager;
            let notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            let Ringtone = RingtoneManager.getRingtone(Application.android.context, notification);
            Ringtone.play();

            setInterval(function() {
                Ringtone.stop();
            }.bind(Ringtone),3000);
        },
        sound_ios: function() {
            AudioServicesPlaySystemSoundWithCompletion(1020,null); //sound
        },
        vibrate_android: function() {
            let vibrateService = Application.android.context.getSystemService(android.content.Context.VIBRATOR_SERVICE);
            vibrateService.vibrate(1000);
        },
        vibrate_ios: function() {
            AudioServicesPlaySystemSoundWithCompletion(1352,null); //vibe
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
        notification_android: function() {
            LocalNotifications.cancelAll();
            LocalNotifications.schedule([
            {
                id: 150, // generated id if not set
                title: '채혈 대기',
                body: '앞으로 나와주세요',
                badge: 1,
                // groupedMessages: ['The first', 'Second', 'Keep going', 'one more..', 'OK Stop'], //android only
                // groupSummary: 'Summary of the grouped messages above', //android only
                // ongoing: true, // makes the notification ongoing (Android only)
                forceShowWhenInForeground: true,
                priority: 0,
                thumbnail: true,
                interval: 'minute',
                channel: 'callApp', // default: 'Channel'
                sound: this.isAndroid ? 'customsound' : 'customsound.wav',
                at: new Date(new Date().getTime() + 5 * 1000), // 10 seconds from now
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
        notification_ios: async function() {
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
                        stop();
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
                showNotifications: true,
                showNotificationsWhenInForeground: true,
                iOSEmulatorFlush: true,
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
                    console.log("firebase.init done");
                },
                error => {
                    console.log(`firebase.init error: ${error}`);
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
        Application.ios ? this.initFirebase_ios() : this.initFirebase();
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
