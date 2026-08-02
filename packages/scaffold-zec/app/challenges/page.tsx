import { ChallengeTrack } from '../../components/ChallengeTrack';

export const metadata = { title: 'Challenges · Speedrun Zcash' };

export default function ChallengesPage() {
  return (
    <main className="wrap section flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">The curriculum</span>
        <h1 className="display text-[40px]">Zero to Zcash contributor</h1>
        <p className="lede">
          Ten challenges, four levels, taken slowly. Each ships something
          real, unlocks the next, and introduces one of the codebases Zcash
          runs on. Start knowing nothing, finish landing pull requests.
        </p>
      </div>

      <ChallengeTrack />
    </main>
  );
}
