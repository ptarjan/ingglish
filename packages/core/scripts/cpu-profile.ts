/**
 * Generate CPU profile for flame graph analysis.
 */
import { Session } from 'inspector';
import { writeFileSync } from 'fs';

const session = new Session();
session.connect();

async function main() {
  const { loadDictionary } = await import('../src/dictionary/loader');
  const { translateSync } = await import('../src/translate/forward');

  await loadDictionary();

  // Real-world text samples
  const samples = [
    // News article style
    `The President announced today that the administration would be implementing new policies
    to address climate change. Scientists have warned that global temperatures continue to rise
    at an alarming rate. Environmental groups praised the decision while industry leaders
    expressed concerns about economic impacts.`,

    // Technical documentation
    `The API endpoint accepts JSON requests with authentication headers. Configure the SDK
    by setting environment variables for the API key and secret. The response includes
    pagination tokens for large result sets. Error handling should check HTTP status codes.`,

    // Casual conversation
    `Hey, did you see that movie last night? It was absolutely incredible! The special effects
    were amazing and the storyline kept me guessing until the very end. We should definitely
    go see it again sometime.`,

    // Wikipedia-style
    `The Amazon rainforest, also known as Amazonia, is a moist broadleaf tropical rainforest
    in the Amazon biome that covers most of the Amazon basin of South America. This basin
    encompasses 7,000,000 km2, of which 5,500,000 km2 are covered by the rainforest.`,
  ];

  const fullText = samples.join('\n\n').repeat(10);

  // Warmup
  for (let i = 0; i < 50; i++) {
    translateSync(fullText);
  }

  // Profile
  session.post('Profiler.enable', () => {
    session.post('Profiler.start', () => {
      console.log('Profiling 500 iterations...');

      for (let i = 0; i < 500; i++) {
        translateSync(fullText);
      }

      session.post('Profiler.stop', (err, { profile }) => {
        writeFileSync('/tmp/cpu-profile.cpuprofile', JSON.stringify(profile));
        console.log('Profile saved to /tmp/cpu-profile.cpuprofile');

        // Output top functions by self time
        interface ProfileNode {
          hitCount: number;
          callFrame: {
            functionName: string;
            url: string;
          };
        }
        const nodes = profile.nodes as ProfileNode[];
        const selfTimes: { name: string; selfTime: number; url: string }[] = [];

        for (const node of nodes) {
          if (node.hitCount > 0) {
            selfTimes.push({
              name: node.callFrame.functionName || '(anonymous)',
              selfTime: node.hitCount,
              url: node.callFrame.url.replace(/.*\//, ''),
            });
          }
        }

        selfTimes.sort((a, b) => b.selfTime - a.selfTime);

        console.log('\n=== Top 20 Hotspots ===\n');
        for (const fn of selfTimes.slice(0, 20)) {
          const hits = String(fn.selfTime).padStart(5);
          const name = fn.name.padEnd(40);
          console.log(hits + ' hits  ' + name + '  ' + fn.url);
        }
      });
    });
  });
}

main().catch(console.error);
