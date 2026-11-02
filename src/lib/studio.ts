/** Studio needs room for its panels and canvas, so it's offered from this width up. Below it, the Design page. */
export const STUDIO_QUERY = '(min-width: 64rem)'

export const designPath = (studio: boolean) => (studio ? '/app/studio' : '/app/design')
