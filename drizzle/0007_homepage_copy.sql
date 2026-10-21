-- Homepage copy, and the price it quotes.
--
-- Copy lives in the `settings` table and a saved value overrides the default in
-- the code, so a redesign that only edits DEFAULT_CONTENT changes nothing on
-- the live site. Production currently holds the old defaults verbatim — nobody
-- has customised the words, they just pressed Save — so replacing them is safe.
--
-- Deliberately field-by-field with json_set rather than replacing the whole
-- object: that preserves the WhatsApp number, thank-you page copy and popup
-- settings the team configured, which a wholesale overwrite would wipe.
--
-- Guarded on the old headline still being in place. If anyone has edited the
-- copy since, this does nothing rather than trampling their words. Idempotent.
UPDATE `settings`
SET `value` = json_set(
      json_set(
      json_set(
      json_set(
      json_set(
      json_set(
      json_set(
      `value`,
      '$.heroTitle', 'Make Space for Better Things.'
    ),
      '$.heroSubtitle', 'Declutter your home the thoughtful way. Givezy collects your pre-loved books from your doorstep and helps them find a more useful next chapter.'
    ),
      '$.pickupLine', 'Doorstep collection included.'
    ),
      '$.impactTitle', 'A better next chapter for every book'
    ),
      '$.impactBody', 'Most books that leave a house go out with the general rubbish, mixed in with everything else, where nothing can be recovered from them.

We sort every bag we collect. Books still fit to read are directed towards reuse partners where they are available. The rest go towards paper recycling wherever feasible.

You get your shelf back, and they get a second life instead of a bin.'
    ),
      '$.howItWorks', json('["Tell us what you''re giving and pay the one-time fee.", "We post you a flat-packed Givezy bag.", "Fill it with books and message us on WhatsApp.", "A courier collects it from your door.", "We sort it \u2014 reuse first, recycling for the rest."]')
    ),
      '$.faqs', json('[{"q": "What can I give Givezy right now?", "a": "Books \u2014 textbooks, novels, children''s books, exam prep, anything still readable. Clothes are coming soon."}, {"q": "What am I paying for?", "a": "A bag posted to your door, doorstep collection by courier, and the sorting and onward logistics afterwards. It is a decluttering service rather than a donation, and your receipt says so."}, {"q": "How does the pickup actually work?", "a": "You book and pay, we post you a flat-packed kraft bag, you fill it and message us on WhatsApp, and a courier collects it from your door. The bag usually takes a few days to reach you."}, {"q": "What happens to my books?", "a": "Every bag is sorted by hand. Books still fit to read are directed towards reuse partners where they are available. Books beyond reuse go towards paper recycling wherever feasible."}, {"q": "Do all the books go to orphanages?", "a": "No. Where a book ends up depends on its condition, whether anyone needs it, and whether a suitable partner has capacity at the time. We would rather say that plainly than promise something we cannot guarantee."}, {"q": "What if my bag is heavier than the limit?", "a": "The courier weighs it at collection. Stay within the limit where you can \u2014 a little over is usually fine, but a much heavier bag may need a second pickup."}, {"q": "Where do you collect from?", "a": "Hyderabad. If we cannot reach your area yet you will not be charged \u2014 you will be offered a place on the waiting list instead."}]')
    ),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'content'
  AND json_valid(`value`)
  AND json_extract(`value`, '$.heroTitle') = 'Your clutter is someone''s treasure.';
--> statement-breakpoint
-- The price the homepage now quotes. Agreed at Rs 499: the courier alone is
-- about Rs 231 and the posted bag another Rs 120-150, so Rs 299 was below cost.
-- Narrow on purpose — only the single-bag setup still sitting at Rs 299.
UPDATE `settings`
SET `value` = json_set(`value`, '$[0].pricePaise', 49900),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'pricing.bags'
  AND json_valid(`value`)
  AND json_array_length(`value`) = 1
  AND json_extract(`value`, '$[0].pricePaise') = 29900;
