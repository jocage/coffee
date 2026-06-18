import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, MessageSquare, Pin, Send, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getClubDetailBySlug } from "@/lib/data/queries";
import { createClubPostAction, joinClubAction } from "@/lib/server-actions/community";

export default async function ClubPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ posted?: string }>;
}) {
  const { slug } = await params;
  const { posted } = await searchParams;
  const detail = await getClubDetailBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { club, isMember, canReadContent, canPost, posts, pinnedRecipes, members, challenges } = detail;
  const activeChallenge = challenges[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <Card className="overflow-hidden p-0">
        <div className="relative h-64">
          <Image src={club.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 to-transparent" />
        </div>
        <div className="-mt-20 relative z-10 p-5">
          <Badge>{club.visibility}</Badge>
          <h1 className="serif mt-3 text-5xl">{club.name}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">{club.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {isMember ? (
              <Badge>Member</Badge>
            ) : (
              <form action={joinClubAction}>
                <input type="hidden" name="clubId" value={club.id} />
                <input type="hidden" name="path" value={`/clubs/${club.slug}`} />
                <Button icon={<Users className="h-4 w-4" aria-hidden />}>Join club</Button>
              </form>
            )}
            {activeChallenge ? (
              <Link href={`/challenges/${activeChallenge.id}`}>
                <Button variant="secondary" icon={<Trophy className="h-4 w-4" aria-hidden />}>
                  Open challenge
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {!canReadContent ? (
        <Card>
          <Lock className="h-6 w-6 text-[var(--accent)]" aria-hidden />
          <CardTitle className="mt-4">Members only</CardTitle>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            This club keeps posts, pinned recipes, member lists and challenges visible to members.
          </p>
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid min-w-0 gap-5">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Create post</CardTitle>
                {posted === "1" ? <Badge>Posted</Badge> : null}
              </div>
              {canPost ? (
                <form action={createClubPostAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="clubId" value={club.id} />
                  <input type="hidden" name="path" value={`/clubs/${club.slug}`} />
                  <textarea
                    name="body"
                    aria-label="Club post"
                    required
                    maxLength={800}
                    rows={4}
                    placeholder="Share a brew finding, question or experiment note."
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="grid gap-1 text-sm">
                      <span className="text-[var(--text-muted)]">Pinned recipe</span>
                      <select
                        name="pinnedRecipeId"
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                        defaultValue=""
                      >
                        <option value="">No recipe</option>
                        {pinnedRecipes.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button className="self-end" icon={<Send className="h-4 w-4" aria-hidden />}>
                      Post
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                  Join the club to post. Public club content stays readable before you join.
                </p>
              )}
            </Card>

            <Card>
              <CardTitle>Posts</CardTitle>
              <div className="mt-4 grid gap-3">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <article key={post.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{post.author.displayName}</p>
                        <time className="text-xs text-[var(--text-dim)]" dateTime={post.createdAt}>
                          {new Date(post.createdAt).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric"
                          })}
                        </time>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{post.body}</p>
                      {post.pinnedRecipe ? (
                        <Link
                          href={`/r/${post.pinnedRecipe.author.handle}/${post.pinnedRecipe.slug}`}
                          className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--accent)]"
                        >
                          <Pin className="h-4 w-4" aria-hidden />
                          {post.pinnedRecipe.title}
                        </Link>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-[var(--radius-sm)] bg-white/5 p-4">
                    <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                    <p className="mt-3 text-sm font-semibold">No posts yet</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Start the discussion with a brew note or question.</p>
                  </div>
                )}
              </div>
            </Card>
          </section>

          <aside className="grid min-w-0 content-start gap-5">
            <Card>
              <CardTitle>Pinned recipes</CardTitle>
              <div className="mt-4 grid gap-3">
                {pinnedRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/r/${recipe.author.handle}/${recipe.slug}`}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] p-3"
                  >
                    <strong className="block text-sm">{recipe.title}</strong>
                    <span className="text-xs text-[var(--text-dim)]">{recipe.method} recipe</span>
                  </Link>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle>Members</CardTitle>
              <p className="mt-4 text-3xl font-bold">{club.memberCount.toLocaleString()}</p>
              <p className="text-sm text-[var(--text-muted)]">baristas and home brewers</p>
              <div className="mt-4 grid gap-2">
                {members.slice(0, 5).map((member) => (
                  <Link key={member.id} href={`/u/${member.handle}`} className="text-sm text-[var(--text-muted)]">
                    {member.displayName} <span className="text-[var(--text-dim)]">@{member.handle}</span>
                  </Link>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle>Challenges</CardTitle>
              <div className="mt-4 grid gap-3">
                {challenges.map((challenge) => (
                  <Link key={challenge.id} href={`/challenges/${challenge.id}`} className="rounded-[var(--radius-sm)] bg-white/5 p-3">
                    <strong className="block text-sm">{challenge.title}</strong>
                    <span className="text-xs text-[var(--text-dim)]">{challenge.entryCount} entries</span>
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
