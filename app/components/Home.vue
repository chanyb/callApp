<template>
    <Page>
        <ActionBar>
            <Label text="Home"/>
        </ActionBar>

        <GridLayout>
            <Label class="info" @tap="isAndroid ? motion_android() : vibrate_ios()">
                <FormattedString>
                    <Span class="fas" text.decode="&#xf135; "/>
                    <Span :text="message" />
                </FormattedString>
            </Label>
        </GridLayout>
    </Page>
</template>

<script>
import { Application, Color, Utils } from '@nativescript/core';
import { LocalNotifications } from '@nativescript/local-notifications';
import { SharedNotificationDelegate } from '@nativescript/shared-notification-delegate';
import { firebase } from '@nativescript/firebase';
import { Human } from '../common';

export default {
    computed: {
        message() {
            return "Blank {N}-Vue";
        }
    },
    methods: {
        test: function() {
            //var notificationManager = NotificationManagerCompat.from(Utils.android.getApplicationContext());
            for(var name in com.google) console.log(name);
        },
        broadcastReceiver_example: function() {
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
        hasPermission_android: function(val) {
            return androidx.core.app.ActivityCompat.checkSelfPermission(Application.android.context, val);
        },
        getPermission_android: function() {
            androidx.core.app.ActivityCompat.requestPermissions(Application.android.foregroundActivity, [android.Manifest.permission.ACCESS_COARSE_LOCATION, android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACTIVITY_RECOGNITION], 0);
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

            var date = new NSDateComponents();
            date.second = 59;
            this.sendNotification_ios('id', date);
            
        },
        sendNotification_ios: function(id, date) {
            var content = UNMutableNotificationContent.new();
            content.title = "채혈 대기 안내";
            content.body = "채혈 1분전입니다. 준비해주세요.";
            content.sound = UNNotificationSound.defaultSound;

            var userInfoDict = NSMutableDictionary.alloc().initWithCapacity(4);
            userInfoDict.setObjectForKey('test_notification'+id, 'id');
            content.userInfo = userInfoDict;

            // var trigger = UNTimeIntervalNotificationTrigger.triggerWithTimeIntervalRepeats(5,false);
            var trigger = UNCalendarNotificationTrigger.triggerWithDateMatchingComponentsRepeats(date, true);
            var request = UNNotificationRequest.requestWithIdentifierContentTrigger("test_notification"+id, content, trigger);
            UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(request, (error) => (error ? console.log(`Error scheduling notification: ${error.localizedDescription}`) : null));
            this.addObserver("test_notification"+id);
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
                },
                userNotificationCenterDidReceiveNotificationResponseWithCompletionHandler: (notificationCenter, notification, handler, stop, next) => {
                    console.log('this is in the DidReceiveNotification33');
                    if (notification.notification.request.content.userInfo.valueForKey('id') === uniqueKey) {
                        // do stuff
                        // intercept it and show alert
                        handler(UNNotificationPresentationOptions.Alert);
                        LocalNotifications.cancelAll();
                        SharedNotificationDelegate.removeObserverByUniqueKey(uniqueKey);
                        LocalNotifications.cancel(uniqueKey /* the ID */).then(foundAndCanceled => {
                            if (foundAndCanceled) {
                                console.log("OK, it's gone!")
                            } else {
                                console.log('No that id was scheduled')
                            }
                        });
                        stop();
                    }
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
        location_android: function() {
            let locationManager = Application.android.context.getSystemService(android.content.Context.LOCATION_SERVICE);

            /* getLastKnownLocation 사용 
            var currentLocation = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
            var latitude = currentLocation.getLatitude();
            var longitude = currentLocation.getLongitude();
            alert("lat: "+latitude+"\nlng: "+longitude);
            */

            /* LocationListener 사용 */
            var gpsListener = new android.location.LocationListener({
                onLocationChanged(location) {
                    var latitude = location.getLatitude();
                    var longitude = location.getLongitude();

                    alert("lat: "+latitude+"\nlng: "+longitude);
                }
            });

            if(locationManager.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)) {
                // 위성 이용
                // locationManager.requestLocationUpdates(android.location.LocationManager.GPS_PROVIDER, 1000, 1, gpsListener);
            }

            if(locationManager.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) {
                // 이동통신 기지국 또는 WiFi access point 이용
                // locationManager.requestLocationUpdates(android.location.LocationManager.NETWORK_PROVIDER, 1000, 1, gpsListener);
            }

        },
        motion_android: function() {
            let sensorManager = Application.android.context.getSystemService(android.content.Context.SENSOR_SERVICE);
            this.getPermission_android();

            var TYPE_STEP_DETECTOR = 18;
            var stepDetector = sensorManager.getDefaultSensor(TYPE_STEP_DETECTOR);
            // console.log();

            var sensorListener = new android.hardware.SensorEventListener({
                onSensorChanged(event) {
                    console.log(event);
                },

                onAccuracyChanged(sensor, accuracy) {
                    // nothing..
                },
            })


            // 센서 속도 설정
            // * 옵션
            // - SENSOR_DELAY_NORMAL: 20,000 초 딜레이
            // - SENSOR_DELAY_UI: 6,000 초 딜레이
            // - SENSOR_DELAY_GAME: 20,000 초 딜레이
            // - SENSOR_DELAY_FASTEST: 딜레이 없음
            sensorManager.registerListener(sensorListener, stepDetector, android.hardware.SensorManager.SENSOR_DELAY_FASTEST)
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
