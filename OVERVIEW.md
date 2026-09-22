# Givezy, in plain language

For anyone who needs to understand how this works without reading code.

---

## What Givezy does

People have books they no longer want. Getting rid of them responsibly is
annoying: you have to find someone who wants them, store them until you do, or
throw them out with the rubbish.

Givezy takes that off their hands. Someone pays a fee, we post them a bag, they
fill it with books, and a courier collects it from their door. The books are then
sorted — readable ones towards reuse, the rest towards paper recycling.

**The customer isn't buying recycling. They're buying their shelf back.**

---

## What it costs

One bag: **₹499**, for up to **5 kg** of books, roughly 10 books.

That price is a starting point, not a final answer. It can be changed in the
admin panel at any time without anyone touching the code.

---

## What a giver experiences

1. They visit **givezy.in** and press **Give Now**.
2. They pick books, optionally add photos, and say what kind of books they are.
3. They enter their address. The site checks whether we collect from their area
   while they type.
4. They pay ₹499.
5. They get a confirmation page and a printable receipt, and see the three steps
   that follow.
6. A Givezy bag arrives in the post.
7. They fill it and message us on WhatsApp.
8. A courier collects it.

If we're full for the day, or we don't reach their area yet, they aren't shown a
payment screen at all. They're offered a place on a waiting list instead, and
nobody is charged for a pickup we can't make.

---

## What the team does

Everything lives in one screen: **givezy.in/admin**, the **Today** page. It is a
to-do list, not a dashboard, and it empties when the day's work is done.

| The list says | Someone needs to |
|---|---|
| Post a de-clutter bag | Put a bag in the post and mark it sent |
| Book the courier | Arrange the collection and record it |
| Follow up — didn't finish paying | Send one WhatsApp message |
| Waiting on the giver | Nothing, unless it's been days |
| Out for pickup | Mark it received when it arrives |

Every entry has call and WhatsApp buttons with the message already written.

[ADMIN.md](./ADMIN.md) is the full guide for whoever runs this day to day.

---

## What the software does on its own

- Takes the payment and confirms it — twice, independently, so a payment can't go
  missing if someone's phone dies mid-transaction
- Refuses bookings from outside the area we collect from
- Stops taking bookings once the daily limit is reached, and collects those
  people onto a waiting list instead
- Works out the price, and never trusts a price sent from someone's browser
- Keeps a receipt, a record, and a photo of every booking
- Backs everything up every night
- Notices people who filled in their address but didn't finish paying, and puts
  them on a follow-up list

## What still needs a person

- Posting the bags
- Arranging each collection, until the courier account is connected
- Sorting the books once they arrive
- Answering WhatsApp — the whole flow depends on this, because that's how
  someone tells us their bag is ready

---

## What it costs to run

| | Roughly |
|---|---|
| Server | $4–6 / month |
| Domain | $0.60 / month |
| Security certificate | Free |
| Deployments | Free |
| Payment fees | Razorpay's cut per transaction |
| Courier | Per pickup, charged to us |

The fee has to cover the courier, the bag, posting the bag, and the payment fee.
Whatever's left is the margin. The admin panel can quote a live courier price for
any pincode, so this can be checked against reality rather than guessed.

---

## What isn't built yet

- **Clothes.** Built but switched off behind "Launching soon".
- **Order tracking for givers.** The courier data is available; there's no page
  for them to see it on yet.
- **Distance-based pricing.** One price everywhere, for now.
- **Automatic emails.** Written, but not switched on — nobody is notified by
  email when a booking arrives.

## What we're careful about

The site doesn't claim books go to specific schools or libraries, and doesn't
claim nothing reaches landfill. Those things can't currently be proven, and
claiming them would be dishonest. It says what actually happens: bags are sorted,
readable books head for reuse, the rest for paper recycling.

The ₹499 is a **service fee for a pickup**, not a charitable donation. The receipt
says so explicitly and states it isn't valid for tax exemption. Worth confirming
with an accountant before anything changes there.

---

## Where things are

| | |
|---|---|
| The website | [givezy.in](https://givezy.in) |
| The admin panel | [givezy.in/admin/login](https://givezy.in/admin/login) |
| Day-to-day guide | [ADMIN.md](./ADMIN.md) |
| Servers and deployment | [DEPLOY.md](./DEPLOY.md) |
| Technical notes | [README.md](./README.md) |
