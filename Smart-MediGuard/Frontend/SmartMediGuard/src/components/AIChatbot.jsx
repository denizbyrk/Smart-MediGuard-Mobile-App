import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const INITIAL_MESSAGES = [
  { id: 1, role: 'bot', text: "Hi! I'm your AI assistant. How can I help you today?" },
];

const QUICK_SUGGESTIONS = [
  { label: "Today's meds",  text: 'What medications should I take today?' },
  { label: 'Set reminder',  text: 'Set a reminder for my next medication' },
];

export function AIChatbot() {

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const CHAT_API_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:5199/api/chat/send' 
    : 'http://localhost:5199/api/chat/send';

  useEffect(() => {
    if (open) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, open, loading]);

  const sendMessage = async (text) => {

    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error('Network response returned an error status');
      }

      const data = await response.json();
      
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: data.reply || "I encountered an empty response. Let's try again.",
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {

      console.error("AI Communication Failure:", error);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: 'bot', text: "Sorry, I can't reach my brain cells right now. Ensure backend is running!" }
      ]);
    } 
    
    finally {
      
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <View style={styles.botAvatar}>
                <Ionicons name="hardware-chip-outline" size={22} color="#2D8659" />
              </View>
              <View>
                <Text style={styles.modalTitle}>AI Assistant</Text>
                <Text style={styles.onlineStatus}>● Connected</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={26} color="#2D8659" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.bubbleRow, msg.role === 'user' ? styles.rowRight : styles.rowLeft]}
                >
                  <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.bubbleRow, styles.rowLeft]}>
                  <View style={[styles.bubble, styles.botBubble, { paddingVertical: 8, paddingHorizontal: 16 }]}>
                    <ActivityIndicator size="small" color="#2D8659" />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.suggestionsRow}>
              {QUICK_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(s.text)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={loading ? "AI is thinking..." : "Type your message..."}
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D8659',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D8659',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  rowLeft:  { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end'   },
  bubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2D8659',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  suggestionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D8659',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});