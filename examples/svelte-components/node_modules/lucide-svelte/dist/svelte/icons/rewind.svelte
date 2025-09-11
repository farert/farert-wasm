<script>import Icon from '../Icon.svelte';
const iconNode = [["polygon", { "points": "11 19 2 12 11 5 11 19" }], ["polygon", { "points": "22 19 13 12 22 5 22 19" }]];
</script>

<Icon name="rewind" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
