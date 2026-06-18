import { Platform } from 'react-native';

const EMULATOR_HOST = '10.0.2.2';
const DEVICE_HOST = '192.168.1.25';

const HOST = Platform.OS === 'android' ? EMULATOR_HOST : 'localhost';

export const BASE_URL = `http://${HOST}:5199/api`;