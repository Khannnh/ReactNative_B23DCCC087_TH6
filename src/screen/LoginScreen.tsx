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
import { getAuthErrorMessage, loginUser } from '../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    const nextEmailError = email.trim() ? '' : 'Vui lòng nhập email.';
    const nextPasswordError = password ? '' : 'Vui lòng nhập mật khẩu.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError('');

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          {formError ? (
            <Text accessibilityRole="alert" style={styles.formError}>
              {formError}
            </Text>
          ) : null}

          <View style={styles.field}>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={value => {
                setEmail(value);
                setEmailError('');
                setFormError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>
          <View style={styles.field}>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={value => {
                setPassword(value);
                setPasswordError('');
                setFormError('');
              }}
              secureTextEntry
              textContentType="password"
              editable={!loading}
              onSubmitEditing={submit}
              returnKeyType="done"
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
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
