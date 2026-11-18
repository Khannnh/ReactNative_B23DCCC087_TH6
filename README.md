# Ứng dụng Chat realtime (React Native CLI + Firebase + Cloudinary)

Ứng dụng nhắn tin 1-1 và nhóm, dùng Firebase Authentication, Firebase Realtime Database và Cloudinary (tải ảnh bằng unsigned upload preset).

## 1. Yêu cầu môi trường

- Node.js 18 trở lên
- JDK 17, Android Studio (SDK + máy ảo Android)
- React Native CLI (không dùng Expo)

## 2. Cài đặt dự án

```bash
npm install
```

Các thư viện chính:

```bash
npm install firebase @react-native-async-storage/async-storage
npm install @react-native-community/geolocation
npm install react-native-image-picker @bam.tech/react-native-image-resizer
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
# Tùy chọn (phần nâng cao): thông báo cục bộ
npm install @notifee/react-native
```

Sau khi cài thư viện có phần native, build lại Android:

```bash
npx react-native run-android
```

## 3. Cấu hình Firebase

### 3.1. Tạo project
1. Vào https://console.firebase.google.com, chọn **Create a project**, đặt tên, có thể tắt Google Analytics, bấm **Create**.

### 3.2. Đăng ký app Web (để lấy config cho Firebase JS SDK)
1. Ở Project Overview bấm biểu tượng `</>` (Web).
2. Đặt nickname bất kỳ, không tick Hosting, bấm **Register app**.
3. Chọn **Use npm**, copy object `firebaseConfig`.
4. Mở lại config bất cứ lúc nào tại: **Project settings (bánh răng) → General → Your apps → app Web → SDK setup and configuration → Config**.

### 3.3. Bật Authentication
1. Menu trái: **Security → Authentication → Get started**.
2. Tab **Sign-in method** → **Email/Password** → bật công tắc **Enable** đầu tiên → **Save**.

### 3.4. Tạo Realtime Database
1. Menu trái: **Databases & Storage → Realtime Database → Create Database**.
2. Chọn vị trí **Singapore (asia-southeast1)**, chọn **Start in locked mode**, bấm **Enable**.
3. Ở đầu tab **Data** copy URL database, dạng
   `https://<project-id>-default-rtdb.asia-southeast1.firebasedatabase.app` (bỏ dấu `/` ở cuối).

### 3.5. Áp dụng luật bảo mật
1. Vào tab **Rules** của Realtime Database.
2. Xóa nội dung cũ, dán toàn bộ nội dung file `database.rules.json` trong mã nguồn.
3. Bấm **Publish**.

Lưu ý: Realtime Database chỉ có một bản luật đang chạy. Khi đổi luật cho phiên bản mới, dữ liệu và code của phiên bản cũ có thể không còn hoạt động đúng.

### 3.6. Điền config vào code
Mở `src/services/firebase.ts` và điền các giá trị vừa lấy:

```ts
const firebaseConfig = {
  apiKey: '<API_KEY>',
  authDomain: '<PROJECT_ID>.firebaseapp.com',
  databaseURL: 'https://<PROJECT_ID>-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: '<PROJECT_ID>',
  storageBucket: '<PROJECT_ID>.firebasestorage.app',
  messagingSenderId: '<SENDER_ID>',
  appId: '<APP_ID>',
};
```

Không cần file `google-services.json` vì ứng dụng dùng Firebase JS SDK.

## 4. Cấu hình Cloudinary (tải ảnh)

Ứng dụng chỉ dùng **unsigned upload preset**, tuyệt đối không đưa API Secret vào mã nguồn.

1. Đăng ký tài khoản miễn phí tại https://cloudinary.com.
2. Vào **Dashboard** (hoặc **Settings → API Keys**), ghi lại **Cloud name**.
3. Bấm bánh răng **Settings → Upload → Upload presets → Add upload preset**.
4. Đặt tên preset (ví dụ `chat_unsigned`), đổi **Signing mode** thành **Unsigned**.
5. (Tùy chọn) đặt **Folder** là `chat-images`, giới hạn định dạng ảnh. Bấm **Save**.
6. Điền vào file cấu hình `src/services/cloudinaryConfig.ts`:

```ts
export const CLOUDINARY_CLOUD_NAME = '<CLOUD_NAME>';
export const CLOUDINARY_UPLOAD_PRESET = '<UNSIGNED_PRESET_NAME>';
```

Địa chỉ tải lên được dùng trong `uploadService`:
`https://api.cloudinary.com/v1_1/<CLOUD_NAME>/image/upload` (gửi `file` và `upload_preset` bằng `FormData`).

## 5. Quyền Android

Trong `android/app/src/main/AndroidManifest.xml` cần có:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Trên máy ảo, đặt vị trí giả tại **Extended controls (dấu ba chấm) → Location → Set location**. Để thử camera, dùng **Extended controls → Camera** hoặc chọn ảnh từ thư viện.

## 6. Chạy ứng dụng

```bash
npx react-native start --reset-cache
# terminal thứ hai
npx react-native run-android
```

Để thử chat, đăng ký ít nhất 2 tài khoản (3 tài khoản nếu thử chat nhóm) và đăng nhập trên các máy ảo/thiết bị khác nhau.

## 7. Cấu trúc dữ liệu Realtime Database

```
conversations/{convId}      : { type: "direct" | "group", name, members: {uid: true}, createdBy, createdAt }
messages/{convId}/{msgId}   : { senderId, type: "text" | "image" | "location", text, imageUrl, lat, lng, createdAt, recalled, reactions: {uid: emoji} }
userChats/{uid}/{convId}    : { lastMessage, lastSenderId, updatedAt, unread }
readStatus/{convId}/{uid}   : thời điểm đọc cuối
typing/{convId}/{uid}       : true
notifications/{uid}/{id}    : { type, convId, fromUid, text, createdAt, read }
users/{uid}                 : { name, email, online, lastSeen }
```

## 8. Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| `auth/operation-not-allowed` | Chưa bật Email/Password trong Authentication |
| `PERMISSION_DENIED` | Chưa publish luật, hoặc ghi vào đường dẫn luật không cho phép |
| Không kết nối database | `databaseURL` sai hoặc thiếu |
| `auth/network-request-failed` | Máy ảo không có internet |
| Tải ảnh lên Cloudinary lỗi 401/400 | Sai cloud name hoặc preset chưa để chế độ Unsigned |
| Không lấy được vị trí trên máy ảo | Chưa đặt vị trí giả trong Extended controls |