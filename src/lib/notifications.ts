/**
 * Requests permission from the browser user to display OS/Desktop notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  return false
}

/**
 * Triggers a native OS / Desktop system notification.
 */
export async function triggerOsNotification(data: {
  title: string
  message: string
  link?: string
  id?: string
}) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null)
      if (registration && registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: data.title || 'Mygreat Alert',
            body: data.message || '',
            icon: '/favicon.ico',
            tag: data.id || String(Date.now()),
            data: { link: data.link || '/dashboard' },
          },
        })
        return
      }
    }

    // Direct Browser Fallback
    const notif = new Notification(data.title || 'Mygreat Alert', {
      body: data.message || '',
      icon: '/favicon.ico',
      tag: data.id || String(Date.now()),
    })

    if (data.link) {
      notif.onclick = () => {
        window.focus()
        window.location.href = data.link!
      }
    }
  } catch (error) {
    console.error('Failed to trigger OS notification:', error)
  }
}

/**
 * Text-to-speech helper — speaks the notification title aloud in a natural female voice.
 */
export function speakNotification(title: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  try {
    window.speechSynthesis.cancel()

    const phrases = [
      `Heads up! ${title}`,
      `Just in — ${title}`,
      `New update: ${title}`,
      `Hey, attention please — ${title}`,
      `You've got a new alert: ${title}`,
    ]
    const text = phrases[Math.floor(Math.random() * phrases.length)]

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.volume = 1

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices()

      // 1. Explicit female tag in voice name
      let chosen = voices.find((v) => /female/i.test(v.name))

      // 2. Known female voice names across Windows, macOS, iOS, Android, Linux
      if (!chosen) {
        chosen = voices.find((v) =>
          /zira|heera|hazel|eva|susan|paulina|sabina|amelie|anna|ioana|joana|helena|nora|sara|vigdis|satu|tessa|samantha|victoria|karen|moira|fiona|google\s+uk\s+english\s+female|google\s+us\s+english/i.test(v.name)
        )
      }

      // 3. Any English voice with female cue
      if (!chosen) {
        chosen = voices.find((v) => v.lang.startsWith('en') && /ira|ella|amy|emma|lisa|nina|alice|aria|jenny/i.test(v.name))
      }

      if (chosen) {
        utterance.voice = chosen
        utterance.pitch = 1.15
      } else {
        utterance.pitch = 1.6
      }

      window.speechSynthesis.speak(utterance)
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoice()
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        applyVoice()
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  } catch (error) {
    console.error('Speech synthesis error:', error)
  }
}
