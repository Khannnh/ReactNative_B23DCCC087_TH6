import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { getAuthErrorMessage, registerUser } from '../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type RegisterErrors = Partial<
  Record<'name' | 'email' | 'password' | 'confirmation' | 'form', string>
>;

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [errors, setErrors] = React.useState<RegisterErrors>({});
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    const nextErrors: RegisterErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Vui lòng nhập họ tên.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    }
    if (!password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    }
    if (!confirmation) {
      nextErrors.confirmation = 'Vui lòng nhập lại mật khẩu.';
    } else if (password !== confirmation) {
      nextErrors.confirmation = 'Mật khẩu nhập lại không khớp.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim(), password);
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const changeField = (
    field: Exclude<keyof RegisterErrors, 'form'>,
    value: string,
    setValue: (nextValue: string) => void,
  ) => {
    setValue(value);
    setErrors(previous => ({ ...previous, [field]: undefined, form: undefined }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu trò chuyện</Text>

          {errors.form ? (
            <Text accessibilityRole="alert" style={styles.formError}>
              {errors.form}
            </Text>
          ) : null}

          <View style={styles.field}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Họ tên"
              value={name}
              onChangeText={value => changeField('name', value, setName)}
              autoCapitalize="words"
              textContentType="name"
              editable={!loading}
            />
            {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
          </View>
          <View style={styles.field}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={value => changeField('email', value, setEmail)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>
          <View style={styles.field}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={value => changeField('password', value, setPassword)}
              secureTextEntry
              textContentType="newPassword"
              editable={!loading}
            />
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>
          <View style={styles.field}>
            <TextInput
              style={[styles.input, errors.confirmation && styles.inputError]}
              placeholder="Nhập lại mật khẩu"
              value={confirmation}
              onChangeText={value => changeField('confirmation', value, setConfirmation)}
              secureTextEntry
              textContentType="newPassword"
              editable={!loading}
            />
            {errors.confirmation ? (
              <Text style={styles.fieldError}>{errors.confirmation}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#1D4ED8', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  field: { marginBottom: 14 },
  input: {
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFF',
    color: '#0F172A',
    fontSize: 15,
  },
  inputError: { borderColor: '#DC2626' },
  fieldError: { color: '#B91C1C', fontSize: 13, marginTop: 5 },
  formError: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
  submitButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkButton: { alignItems: 'center', padding: 16 },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
});
