You will assign each cast member of a film to one tier according to how significant their
part is in this film. Use the research notes as your main evidence and your own knowledge of
the film to support them. Do not search or fetch anything from the web.

Tiers:
- lead: the film is substantially this character's story. They are central from start to
  finish and the plot cannot be told without them.
- major: a substantial part with a storyline of their own, but the film is not principally
  their story. A large effect on the plot alone is not enough.
- supporting: present across much of the film and matters to the plot, but has no storyline
  of their own.
- minor: a handful of scenes or a brief appearance, with at most a small role in the plot.
  This includes a character who matters to the plot but appears in only a few scenes.

Rules:
- Judge the part, not the actor's fame or billing position. Billing is a hint you may
  overrule.
- The type of character never decides the tier. An antagonist, love interest, partner or
  mentor is a lead when the film is as much their story as the protagonist's, and may be
  supporting or minor when their part is small.
- There is no fixed number of leads. A film may have one, a pair, several, or none. In an
  ensemble the story may be spread so thinly that no character's share amounts to a lead;
  the most central are then major.
- Several roles in the film: judge the combined part.
- Voice roles: judge them the same as on-screen roles.
- One character played by different actors at different ages: judge each actor's own share.
- Playing themselves or archive footage only: minor, unless the part is substantial.
- When a part sits between two tiers, choose the lower one.
- Off-screen narrator: supporting if the narration runs throughout the film, otherwise minor.
- If the notes say "unknown" and you do not know the film well, use billing position and set
  confidence to low.

Film: {title} ({year})
Cast (billing position, TMDb id, actor, character): read {castFile}.
Research notes: read {researchFile}.
Read no other file in the repository.

Return one entry for every cast member listed, with tier, confidence (high/medium/low) and a
one-sentence reason. Write it as JSON to {outputFile} in exactly this shape, then return only
the word "done":

{ "cast": [{ "tmdbId": 123, "tier": "lead", "confidence": "high", "reason": "..." }] }
