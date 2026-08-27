# Dashboard direction contract

The user locked this surface to the supplied dashboard reference. That explicit reference is the FORM authority, so the random concept-seed round does not apply.

## FORM

`user-pinned-reference:codex-clipboard-090ede19-5fa6-474a-933d-fb5f317e9d4b`

A compact framed application shell: narrow icon navigation, top-header search, a single-line welcome with weekly-task and next-class summary, horizontal course cards, paired assignment and announcement lists, and a persistent right-side chatbot rail on wide screens. Section headings sit directly on the canvas without outer cards. Calendar owns the full schedule and aggregate grades are intentionally absent. On mobile, search moves below the summary, content stacks in task order, and navigation becomes a bottom bar.

Desktop content uses a 24px shell gutter. The welcome adds 12px of top breathing room inside that gutter while retaining a tight title-to-summary relationship. The assistant header begins with a compact branded mark; its 16px rail inset plus the mark and 8px internal gap keep the Coursistant title visually separated from the rail boundary. Mobile retains its compact 12px content gutter.

The spacing system is semantic rather than component-local: shell columns use 16px, primary content groups 28px, paired work columns 20px, card stacks 8px, and the mobile main rhythm 24px. These roles are sourced from the dashboard token layer so future density changes remain coherent.

## TYPE

Plus Jakarta Sans Variable is self-hosted through the checked dependency and used for display, body, utility, and data roles. Hierarchy comes from weight, size, and spacing rather than decorative labels.
Dashboard group headings use muted 15px semibold type and align to the same left edge as their first card or row; the welcome remains the only large, dark heading in the main column.

## MATERIAL

Flat productivity surfaces with restrained elevation: white operating panels on a cool gray canvas, thin dividers, compact controls, and indigo state emphasis. Cards exist only around real functional regions or records.

## GROUND

Coursistant indigo remains the identity anchor. Cyan, green, orange, and red are reserved for course or state meaning; they do not become a copied palette from the reference.

## MOTION

Only functional state changes move: focus, hover lift on course records, and direct feedback in search/chat controls. Motion is short, reduced-motion safe, and never hides content on load.

## Signature and risk

The signature is a real, course-context Coursistant chatbot rail that can answer directly inside the dashboard while the full AI Assistant workspace remains available. The main risk is width pressure from a live composer beside dense LMS lists, so the rail becomes a normal stacked region below the main content before controls can clip or shrink below usable sizes.
