<script>import Icon from '../Icon.svelte';
const iconNode = [["polygon", { "points": "3 11 22 2 13 21 11 13 3 11" }]];
</script>

<Icon name="navigation" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
