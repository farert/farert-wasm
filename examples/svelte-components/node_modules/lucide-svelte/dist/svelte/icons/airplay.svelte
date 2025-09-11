<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" }], ["polygon", { "points": "12 15 17 21 7 21 12 15" }]];
</script>

<Icon name="airplay" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
