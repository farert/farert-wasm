<script>import Icon from '../Icon.svelte';
const iconNode = [["polygon", { "points": "12 2 19 21 12 17 5 21 12 2" }]];
</script>

<Icon name="navigation-2" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
