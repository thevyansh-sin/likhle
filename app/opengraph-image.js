import { ImageResponse } from 'next/og';

export const alt = 'Likhle';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const chips = ['Captions', 'Bios', 'Hooks', 'Hinglish', 'Free'];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#080808',
          color: '#f4f4f0',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(202,255,0,0.25) 0%, rgba(202,255,0,0) 36%), radial-gradient(circle at bottom left, rgba(255,45,120,0.16) 0%, rgba(255,45,120,0) 28%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '56px 64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              likhle
              <span style={{ color: '#CAFF00' }}>.</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 860,
                fontSize: 84,
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: -3,
              }}
            >
              <span>AI writing tool</span>
              <span>for Gen Z India</span>
            </div>

            <div
              style={{
                maxWidth: 860,
                fontSize: 32,
                lineHeight: 1.35,
                color: '#BDBDB5',
              }}
            >
              Create captions, bios, Reels hooks, WhatsApp statuses, LinkedIn bios,
              Twitter/X bios, and Hinglish content.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 22px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: chip === 'Free' ? '#CAFF00' : 'rgba(255,255,255,0.04)',
                  color: chip === 'Free' ? '#080808' : '#E9E9E1',
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
