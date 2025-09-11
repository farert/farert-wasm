<script>import Icon from '../Icon.svelte';
const iconNode = [["polyline", { "points": "7 17 2 12 7 7" }], ["polyline", { "points": "12 17 7 12 12 7" }], ["path", { "d": "M22 18v-2a4 4 0 0 0-4-4H7" }]];
</script>

<Icon name="reply-all" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
